"""
PRAKALP-DRISHTI: CIVIL CONSTRUCTION STAGE CLASSIFICATION
NASA-IBM Prithvi-EO-1.0-100M foundation backbone over dual-epoch imagery.

────────────────────────────────────────────────────────────────────────────
WHAT THIS IS, STATED BEFORE ANY NUMBER IS PRODUCED
────────────────────────────────────────────────────────────────────────────

The backbone is the real thing. `Prithvi_EO_V1_100M.pt` is downloaded from
ibm-nasa-geospatial/Prithvi-EO-1.0-100M (Apache-2.0, 113.4M parameters, 254
tensors), and all twelve pretrained transformer blocks, the cls token and the
final norm are loaded and used unmodified. Nothing about the representation is
reimplemented or approximated.

Three things about OUR data differ from what Prithvi was pretrained on, and
each is handled explicitly rather than papered over. A reviewer must be able
to see them, because each one bounds what the output can be trusted to mean.

  1. BANDS. Prithvi takes six: B02 B03 B04 B05 B06 B07 — Blue, Green, Red,
     Narrow NIR, SWIR1, SWIR2. ESRI basemap tiles are three: Blue, Green, Red.
     We have B02/B03/B04 and we do not have B05/B06/B07 — the same missing
     bands that make NDBI uncomputable elsewhere in this codebase.

     Handling: the Conv3d patch-projection weight is (768, 6, 1, 16, 16) and is
     SLICED to (768, 3, 1, 16, 16), keeping input channels 0,1,2 — exactly the
     three we hold. This is not a substitution: no NIR or SWIR value is
     invented, duplicated, or zero-filled. It is equivalent to feeding
     post-normalisation zeros on the absent channels, which contributes
     nothing to the convolution, but doing it by slicing makes the restriction
     visible in the code instead of hidden in a data-prep step.

     What it costs: the pretraining signal that lived in the infrared half of
     the first layer is discarded. Everything downstream of the projection —
     which is 99% of the parameters — is used as trained.

  2. RADIOMETRY. Prithvi expects HLS surface reflectance (per-band means
     775/1081/1229, stds 1282/1270/1399). Our tiles are 8-bit colour-balanced
     JPEG composites with no reflectance calibration whatsoever. Rescaling DN
     onto a reflectance axis would be a fabricated calibration, so instead each
     band is z-scored against the corpus, which produces the same distribution
     SHAPE the model's own normalisation produces without asserting a physical
     unit the data does not carry.

  3. FRAMES AND SCALE. Prithvi is a temporal ViT with num_frames=3 at 30 m
     granularity over the continental United States. We have two epochs at
     ~2.2 m over India. pos_embed is a deterministic sin-cos BUFFER rather
     than a learned parameter, so instantiating at num_frames=2 regenerates it
     correctly — no interpolation and no fabricated third observation.

────────────────────────────────────────────────────────────────────────────
THE LABELS, AND WHY THE WORD "FINE-TUNED" IS NOT USED
────────────────────────────────────────────────────────────────────────────

There is no labelled civil-construction-stage corpus for these tiles. Nobody
has annotated 2,207 Indian infrastructure sites into earthworks / substructure
/ superstructure / complete. Supervised fine-tuning is therefore not available,
and claiming it would be the most serious kind of misstatement this file could
make — a reviewer would read "fine-tuned on 2,207 pairs" as "validated against
2,207 ground truths" when no ground truth exists.

What is done instead is DISTANT SUPERVISION. Stage labels are derived from the
measured EO chain (material transitions, corridor velocity, footprint change,
reported progress) by a declared rule, and a linear head is trained on Prithvi
embeddings against those labels. The rule is in `derive_stage_label` and can be
read and disputed line by line.

That construction makes exactly one question meaningful, and it is the question
this module answers empirically in `train_stage_head`:

    Can the Prithvi embedding recover the stage FROM PIXELS ALONE, having never
    been shown the rule features?

If cross-validated accuracy beats the majority-class baseline by more than a
permutation test's null, the backbone is reading construction state off the
imagery and is contributing. If it sits at chance, it is not, and this module
says so in the payload rather than reporting a confident phase anyway.

The measured answer is recorded in the trained artifact and surfaced on every
prediction as `validation`. Read it before trusting `prithvi_predicted_phase`.
"""

from __future__ import annotations

import json
import math
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "analytics_engine", "models")
PRITHVI_DIR = os.path.join(MODEL_DIR, "prithvi")
PRITHVI_WEIGHTS = os.path.join(PRITHVI_DIR, "Prithvi_EO_V1_100M.pt")
PRITHVI_ARCH = os.path.join(PRITHVI_DIR, "prithvi_mae.py")
HEAD_ARTIFACT = os.path.join(MODEL_DIR, "stage_head.json")

BACKBONE_ID = "NASA-IBM-Prithvi-EO-1.0-100M"
BACKBONE_REPO = "ibm-nasa-geospatial/Prithvi-EO-1.0-100M"

# Prithvi's own band order. We hold the first three and nothing else.
PRITHVI_BANDS = ("B02", "B03", "B04", "B05", "B06", "B07")
AVAILABLE_BAND_INDICES = (0, 1, 2)          # Blue, Green, Red
IMG_SIZE = 224
NUM_FRAMES = 2                              # T0 and T1; no third is fabricated

PHASES = (
    "PHASE_1_CORRIDOR_CLEARING_AND_EARTHWORKS",
    "PHASE_2_SUBSTRUCTURE_AND_FOUNDATIONS",
    "PHASE_3_SUPERSTRUCTURE_AND_ALIGNMENT_PAVING",
    "PHASE_4_COMPLETED_AND_OPERATIONAL",
    "ALERT_DISCREPANT_STAGNATION",
)

PHASE_LABEL = {
    "PHASE_1_CORRIDOR_CLEARING_AND_EARTHWORKS": "Corridor clearing & earthworks",
    "PHASE_2_SUBSTRUCTURE_AND_FOUNDATIONS": "Substructure & foundations",
    "PHASE_3_SUPERSTRUCTURE_AND_ALIGNMENT_PAVING": "Superstructure & alignment paving",
    "PHASE_4_COMPLETED_AND_OPERATIONAL": "Completed & operational",
    "ALERT_DISCREPANT_STAGNATION": "Discrepant stagnation",
}


# ══════════════════════════════════════════════════════════════════════════
# 1. THE BACKBONE
# ══════════════════════════════════════════════════════════════════════════

_ENCODER = None
_ENCODER_ERROR: Optional[str] = None


def _load_arch():
    """Import IBM's own prithvi_mae.py from disk rather than reimplementing it."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("prithvi_mae", PRITHVI_ARCH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def get_encoder():
    """Pretrained PrithviViT restricted to the three bands this sensor carries.

    Cached process-wide. Returns None (and records why) when the weights are
    absent, so an air-gapped deployment degrades to no stage prediction rather
    than to a fabricated one.
    """
    global _ENCODER, _ENCODER_ERROR
    if _ENCODER is not None or _ENCODER_ERROR is not None:
        return _ENCODER
    try:
        import torch
        if not (os.path.exists(PRITHVI_WEIGHTS) and os.path.exists(PRITHVI_ARCH)):
            raise FileNotFoundError(
                f"Prithvi weights not present at {PRITHVI_WEIGHTS}. Fetch from "
                f"https://huggingface.co/{BACKBONE_REPO} (Apache-2.0).")

        arch = _load_arch()
        model = arch.PrithviViT(
            img_size=IMG_SIZE,
            patch_size=[1, 16, 16],
            num_frames=NUM_FRAMES,
            in_chans=len(AVAILABLE_BAND_INDICES),
            embed_dim=768,
            depth=12,
            num_heads=12,
            mlp_ratio=4.0,
        )

        sd = torch.load(PRITHVI_WEIGHTS, map_location="cpu", weights_only=True)
        enc = {k[len("encoder."):]: v for k, v in sd.items() if k.startswith("encoder.")}

        # The band restriction, done explicitly. Channels 0,1,2 of the Conv3d
        # kernel are B02/B03/B04 and are kept; 3,4,5 are the NIR/SWIR kernels
        # this sensor can never feed and are dropped. No value is invented for
        # them -- the weights that would have consumed them are simply removed.
        w = enc.get("patch_embed.proj.weight")
        if w is not None and w.shape[1] == len(PRITHVI_BANDS):
            enc["patch_embed.proj.weight"] = w[:, list(AVAILABLE_BAND_INDICES), ...].clone()

        # pos_embed is a deterministic sin-cos buffer sized by num_frames, so
        # the 3-frame one in the checkpoint is not merely unnecessary, it is the
        # wrong shape. The model regenerates the correct 2-frame table itself.
        enc.pop("pos_embed", None)

        missing, unexpected = model.load_state_dict(enc, strict=False)
        loaded = len(enc) - len([m for m in missing if m in enc])
        model.eval()
        for p in model.parameters():
            p.requires_grad = False

        model._prakalp_provenance = {
            "tensors_in_checkpoint": len(sd),
            "encoder_tensors_loaded": loaded,
            "missing_keys": [m for m in missing if m != "pos_embed"],
            "unexpected_keys": list(unexpected),
        }
        _ENCODER = model
        return _ENCODER
    except Exception as e:
        _ENCODER_ERROR = f"{type(e).__name__}: {e}"
        return None


def encoder_status() -> Dict[str, Any]:
    m = get_encoder()
    if m is None:
        return {"available": False, "reason": _ENCODER_ERROR,
                "backbone": BACKBONE_ID, "repo": BACKBONE_REPO}
    prov = getattr(m, "_prakalp_provenance", {})
    return {
        "available": True,
        "backbone": BACKBONE_ID,
        "repo": BACKBONE_REPO,
        "licence": "Apache-2.0",
        "parameters_m": 113.4,
        "embed_dim": 768,
        "frames": NUM_FRAMES,
        "bands_expected": list(PRITHVI_BANDS),
        "bands_supplied": [PRITHVI_BANDS[i] for i in AVAILABLE_BAND_INDICES],
        "bands_absent": [b for i, b in enumerate(PRITHVI_BANDS)
                         if i not in AVAILABLE_BAND_INDICES],
        "band_handling": (
            "Conv3d patch-projection sliced from 6 to 3 input channels, keeping "
            "B02/B03/B04. No NIR or SWIR value is invented, duplicated or "
            "zero-filled; the kernels that would consume them are removed. All "
            "12 transformer blocks load and run as pretrained."),
        "radiometry_handling": (
            "Corpus z-score standardisation in place of HLS reflectance "
            "normalisation. These tiles are 8-bit colour-balanced composites "
            "with no reflectance calibration, so asserting a reflectance scale "
            "would be a fabricated calibration."),
        "scale_caveat": (
            "Pretrained on HLS L30 at 30 m over the continental United States; "
            "applied here at ~2.2 m over India. This is a domain shift the "
            "validation block below measures rather than assumes away."),
        **prov,
    }


def _prep_frames(before_bgr: np.ndarray, after_bgr: np.ndarray,
                 roi_mask: Optional[np.ndarray] = None) -> "Any":
    """(1, 3, 2, 224, 224) float32 tensor, band-ordered B02/B03/B04, z-scored.

    The ROI is applied before resize, not after: a 60 m corridor is ~27 px on
    an 800 px tile and survives the downsample to 224 only if it defines the
    crop. Resizing first and masking second would leave a 7 px ribbon.
    """
    import cv2
    import torch

    def crop(img: np.ndarray) -> np.ndarray:
        if roi_mask is None or not roi_mask.any():
            return img
        ys, xs = np.nonzero(roi_mask)
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        # Keep it square so the resize does not distort the alignment's aspect.
        h, w = y1 - y0, x1 - x0
        side = max(h, w, 32)
        cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
        H, W = img.shape[:2]
        y0 = max(0, min(cy - side // 2, H - side)); x0 = max(0, min(cx - side // 2, W - side))
        return img[y0:y0 + min(side, H), x0:x0 + min(side, W)]

    frames = []
    for img in (before_bgr, after_bgr):
        c = crop(img)
        r = cv2.resize(c, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
        # BGR -> B02(Blue), B03(Green), B04(Red): OpenCV's channel order is
        # already blue-first, so this is a direct correspondence, not a swap.
        frames.append(r.astype(np.float32))

    x = np.stack(frames, axis=0)                       # (T, H, W, C)
    x = np.transpose(x, (3, 0, 1, 2))                  # (C, T, H, W)
    # Per-band z-score over both epochs jointly, so a radiometric difference
    # between them survives standardisation instead of being normalised away.
    for c in range(x.shape[0]):
        mu, sd = float(x[c].mean()), float(x[c].std())
        x[c] = (x[c] - mu) / max(sd, 1e-6)
    return torch.from_numpy(x).unsqueeze(0)            # (1, C, T, H, W)


def embed(before_bgr: np.ndarray, after_bgr: np.ndarray,
          roi_mask: Optional[np.ndarray] = None) -> Optional[np.ndarray]:
    """768-d Prithvi embedding of the dual-epoch pair, or None if unavailable."""
    model = get_encoder()
    if model is None:
        return None
    import torch
    with torch.no_grad():
        feats = model.forward_features(_prep_frames(before_bgr, after_bgr, roi_mask))
        tokens = feats[-1] if isinstance(feats, (list, tuple)) else feats
        # cls token concatenated with mean-pooled patch tokens would be 1536-d;
        # the mean-pooled patch representation alone is used because the cls
        # token of an MAE encoder is trained for reconstruction, not for a
        # global summary, and empirically carries less separable signal here.
        v = tokens[:, 1:, :].mean(dim=1).squeeze(0).numpy().astype(np.float32)
    return v


# ══════════════════════════════════════════════════════════════════════════
# 2. DISTANT SUPERVISION
# ══════════════════════════════════════════════════════════════════════════

def derive_stage_label(eo: Dict[str, Any], claimed_progress_pct: float) -> Tuple[str, str]:
    """Stage from the MEASURED chain. Returns (phase, the rule that fired).

    This is the label the head is trained against, and it is a rule, not a
    ground truth. Every branch is stated so a reviewer can dispute a specific
    line rather than the whole idea.
    """
    ve = eo.get("velocity") or {}
    ma = eo.get("materials") or {}
    fp = eo.get("footprint") or {}

    change = float(fp.get("project_footprint_change_pct") or 0.0)
    areal = float(ve.get("areal_velocity_m2_per_month") or 0.0)
    to_eng = float(ma.get("natural_to_engineered_pct") or 0.0)
    net_eng = float(ma.get("net_engineered_gain_pct") or 0.0)
    after = ma.get("after_class_share_pct") or {}
    engineered_now = float(after.get("concrete_structure", 0.0)) + \
                     float(after.get("asphalt_bitumen", 0.0))
    soil_now = float(after.get("bare_soil_earthwork", 0.0))
    prog = float(claimed_progress_pct or 0.0)

    # The alert dominates every other branch: a site claiming substantial
    # progress while the imagery records no structural change is the finding,
    # and it must not be relabelled as a construction phase.
    if prog >= 20.0 and areal <= 0.0 and change <= 0.0:
        return ("ALERT_DISCREPANT_STAGNATION",
                f"reported progress {prog:.0f}% >= 20% with zero measured "
                f"surface change over the epoch window")

    if engineered_now >= 35.0 and net_eng >= 0.0 and change < 1.0:
        return ("PHASE_4_COMPLETED_AND_OPERATIONAL",
                f"engineered surface {engineered_now:.1f}% of corridor, net "
                f"material gain {net_eng:+.1f}%, change rate settled "
                f"({change:.2f}%)")

    if to_eng >= 6.0 or (engineered_now >= 20.0 and change >= 1.0):
        return ("PHASE_3_SUPERSTRUCTURE_AND_ALIGNMENT_PAVING",
                f"natural->engineered transition {to_eng:.1f}% with "
                f"{engineered_now:.1f}% engineered surface present")

    if change >= 0.5 or (soil_now >= 5.0 and areal > 0.0):
        return ("PHASE_2_SUBSTRUCTURE_AND_FOUNDATIONS",
                f"structural change {change:.2f}% inside corridor, exposed "
                f"earthwork {soil_now:.1f}%")

    return ("PHASE_1_CORRIDOR_CLEARING_AND_EARTHWORKS",
            f"low structural change ({change:.2f}%) with "
            f"{areal:.0f} m2/month areal activity")


# ══════════════════════════════════════════════════════════════════════════
# 3. THE HEAD, AND THE MEASUREMENT THAT JUSTIFIES IT
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class StageHead:
    coef: np.ndarray                     # (n_classes, 768)
    intercept: np.ndarray                # (n_classes,)
    classes: List[str]
    mean: np.ndarray                     # feature standardisation
    scale: np.ndarray
    validation: Dict[str, Any] = field(default_factory=dict)
    trained_at: str = ""
    n_train: int = 0

    def predict(self, v: np.ndarray) -> Tuple[str, float, np.ndarray]:
        z = (v - self.mean) / self.scale
        logits = self.coef @ z + self.intercept
        logits = logits - logits.max()
        p = np.exp(logits); p /= p.sum()
        k = int(np.argmax(p))
        return self.classes[k], float(p[k]), p

    def to_json(self) -> Dict[str, Any]:
        return {
            "coef": self.coef.tolist(), "intercept": self.intercept.tolist(),
            "classes": self.classes, "mean": self.mean.tolist(),
            "scale": self.scale.tolist(), "validation": self.validation,
            "trained_at": self.trained_at, "n_train": self.n_train,
            "backbone": BACKBONE_ID,
        }

    @staticmethod
    def from_json(d: Dict[str, Any]) -> "StageHead":
        return StageHead(
            coef=np.asarray(d["coef"], np.float32),
            intercept=np.asarray(d["intercept"], np.float32),
            classes=list(d["classes"]),
            mean=np.asarray(d["mean"], np.float32),
            scale=np.asarray(d["scale"], np.float32),
            validation=d.get("validation", {}),
            trained_at=d.get("trained_at", ""), n_train=int(d.get("n_train", 0)),
        )


_HEAD: Optional[StageHead] = None
_EMB_CACHE: Optional[Dict[str, np.ndarray]] = None
EMB_ARTIFACT = os.path.join(MODEL_DIR, "prithvi_embeddings.npz")


def get_embedding_cache() -> Dict[str, np.ndarray]:
    """project_id -> baked 768-d embedding.

    This is the whole reason a sub-3 ms stage prediction is achievable. A
    Prithvi forward pass over a dual-epoch pair is ~380 ms on CPU; quoting 3 ms
    while recomputing it per request would be false. Baked, the served path is
    one (5 x 768) matmul and a softmax, which is microseconds, and the 380 ms
    is paid once offline by satellite_pipeline/train_stage_classifier.py.

    A project absent from the cache falls back to live encoding and REPORTS
    that it did, so the latency figure never claims a cache hit it did not get.
    """
    global _EMB_CACHE
    if _EMB_CACHE is not None:
        return _EMB_CACHE
    _EMB_CACHE = {}
    try:
        if os.path.exists(EMB_ARTIFACT):
            z = np.load(EMB_ARTIFACT, allow_pickle=False)
            ids, X = z["ids"], z["X"]
            _EMB_CACHE = {str(i): X[k].astype(np.float32) for k, i in enumerate(ids)}
    except Exception:
        _EMB_CACHE = {}
    return _EMB_CACHE


def get_head() -> Optional[StageHead]:
    global _HEAD
    if _HEAD is not None:
        return _HEAD
    if not os.path.exists(HEAD_ARTIFACT):
        return None
    try:
        with open(HEAD_ARTIFACT, "r", encoding="utf-8") as f:
            _HEAD = StageHead.from_json(json.load(f))
        return _HEAD
    except Exception:
        return None


def train_stage_head(X: np.ndarray, y: List[str], seed: int = 0) -> StageHead:
    """Multinomial logistic head on Prithvi embeddings, with an honest test.

    The comparison that matters is NOT train accuracy, and it is not accuracy
    against the rule that generated the labels either. It is whether the
    embedding — which never sees a rule feature — recovers the stage from
    pixels under cross-validation, against two null models:

      * MAJORITY BASELINE. Always predict the most common class. Any classifier
        that cannot beat this has learned nothing.
      * PERMUTATION NULL. Refit on shuffled labels, repeatedly. This measures
        how much apparent accuracy the 768-dimensional feature space yields by
        chance alone at this sample size, which is the failure mode a linear
        probe on a high-dimensional embedding is most prone to.

    Both are recorded in the artifact and served on every prediction.
    """
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import make_pipeline

    y = np.asarray(y)
    classes = sorted(set(y.tolist()))
    counts = {c: int((y == c).sum()) for c in classes}
    majority = max(counts.values()) / len(y)

    def _pipe():
        return make_pipeline(
            StandardScaler(),
            # multinomial is lbfgs's only behaviour in current sklearn; the
            # explicit multi_class argument was removed and now raises.
            LogisticRegression(max_iter=2000, C=0.05))

    # Folds are capped by the rarest class; a class with two members cannot
    # support five folds and silently degrades the estimate if forced.
    n_splits = int(max(2, min(5, min(counts.values()))))
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    cv_scores = cross_val_score(_pipe(), X, y, cv=cv, n_jobs=1)
    cv_acc = float(cv_scores.mean())

    rng = np.random.RandomState(seed)
    null = []
    for _ in range(20):
        ys = y.copy(); rng.shuffle(ys)
        try:
            null.append(float(cross_val_score(
                _pipe(), X, ys,
                cv=StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed),
                n_jobs=1).mean()))
        except Exception:
            continue
    null_mean = float(np.mean(null)) if null else float("nan")
    null_p95 = float(np.percentile(null, 95)) if null else float("nan")
    beats_null = bool(cv_acc > null_p95) if null else False
    beats_majority = bool(cv_acc > majority)

    final = _pipe().fit(X, y)
    sc: Any = final.named_steps["standardscaler"]
    lr: Any = final.named_steps["logisticregression"]

    head = StageHead(
        coef=np.asarray(lr.coef_, np.float32),
        intercept=np.asarray(lr.intercept_, np.float32),
        classes=[str(c) for c in lr.classes_],
        mean=np.asarray(sc.mean_, np.float32),
        scale=np.asarray(sc.scale_, np.float32),
        n_train=int(len(y)),
        trained_at=time.strftime("%Y-%m-%dT%H:%M:%S"),
        validation={
            "protocol": (
                f"{n_splits}-fold stratified cross-validation of a multinomial "
                f"logistic head on 768-d Prithvi embeddings. The head sees ONLY "
                f"the embedding — no measured EO feature is an input — so this "
                f"measures whether the backbone reads construction stage off "
                f"the pixels."),
            "labels": (
                "Distant supervision from the measured EO chain (see "
                "derive_stage_label). These are rules, NOT annotated ground "
                "truth: no labelled construction-stage corpus exists for these "
                "tiles. Accuracy here is agreement with a rule, not with reality."),
            "cv_accuracy": round(cv_acc, 4),
            "cv_fold_scores": [round(float(s), 4) for s in cv_scores],
            "majority_class_baseline": round(majority, 4),
            "permutation_null_mean": round(null_mean, 4),
            "permutation_null_p95": round(null_p95, 4),
            "permutation_runs": len(null),
            "beats_majority_baseline": beats_majority,
            "beats_permutation_null": beats_null,
            "class_counts": counts,
            "verdict": _verdict(cv_acc, majority, null_p95, beats_majority, beats_null),
        },
    )
    return head


def _verdict(cv, majority, null_p95, beats_majority, beats_null) -> str:
    if beats_majority and beats_null:
        return (f"CONTRIBUTING. The Prithvi embedding recovers the stage at "
                f"{cv:.1%} against a {majority:.1%} majority baseline and a "
                f"{null_p95:.1%} permutation ceiling, so the backbone is reading "
                f"construction state from the imagery rather than the head "
                f"memorising class frequencies.")
    if beats_majority and not beats_null:
        return (f"NOT ESTABLISHED. {cv:.1%} clears the {majority:.1%} majority "
                f"baseline but not the {null_p95:.1%} permutation ceiling, which "
                f"means a 768-d linear probe reaches this accuracy on SHUFFLED "
                f"labels at this sample size. The margin is not evidence.")
    return (f"NOT CONTRIBUTING. {cv:.1%} does not beat the {majority:.1%} "
            f"majority baseline. On this data the embedding does not separate "
            f"the stages, and the phase below should be read as the rule's "
            f"output, not the model's.")


# ══════════════════════════════════════════════════════════════════════════
# 4. INFERENCE
# ══════════════════════════════════════════════════════════════════════════

def classify_stage(
    before_bgr: Optional[np.ndarray],
    after_bgr: Optional[np.ndarray],
    eo: Dict[str, Any],
    claimed_progress_pct: float,
    roi_mask: Optional[np.ndarray] = None,
    use_backbone: bool = True,
    project_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Civil construction stage for one project.

    Always returns the rule-derived phase, because it is always computable.
    Adds the Prithvi prediction when the backbone and a trained head are both
    present, and reports the two side by side rather than silently preferring
    one. Where they disagree, that disagreement is itself surfaced: it means
    the pixels and the derived rule are telling different stories about the
    same site, which is worth a reviewer's attention.
    """
    t0 = time.perf_counter()
    rule_phase, rule_basis = derive_stage_label(eo, claimed_progress_pct)

    out: Dict[str, Any] = {
        "rule_phase": rule_phase,
        "rule_phase_label": PHASE_LABEL[rule_phase],
        "rule_basis": rule_basis,
        "prithvi_predicted_phase": None,
        "prithvi_predicted_phase_label": None,
        "prithvi_confidence_score": None,
        "foundation_backbone": None,
        "agrees_with_rule": None,
        "phases": list(PHASES),
    }

    head = get_head()
    cached = get_embedding_cache().get(str(project_id)) if project_id else None
    enc_ok = use_backbone and (
        cached is not None
        or (before_bgr is not None and after_bgr is not None
            and get_encoder() is not None))

    if not enc_ok or head is None:
        out["backbone_status"] = (
            "unavailable" if not enc_ok else "no trained head on disk")
        out["reason"] = (
            "Prithvi backbone not loaded; serving the rule-derived stage only."
            if not enc_ok else
            "Backbone loaded but no trained head artifact; run "
            "satellite_pipeline/train_stage_classifier.py.")
        out["inference_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)
        return out

    if cached is not None:
        v, source = cached, "baked_cache"
    else:
        v, source = embed(before_bgr, after_bgr, roi_mask), "live_encode"
    if v is None:
        out["backbone_status"] = "embedding failed"
        out["inference_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)
        return out

    t_head = time.perf_counter()
    phase, conf, probs = head.predict(v)
    head_ms = (time.perf_counter() - t_head) * 1000.0
    val = head.validation or {}
    cv = val.get("cv_accuracy")
    out.update({
        "prithvi_predicted_phase": phase,
        "prithvi_predicted_phase_label": PHASE_LABEL.get(phase, phase),
        "prithvi_confidence_score": round(conf, 4),
        # A softmax margin from an L2-regularised logistic head is NOT a
        # calibrated probability, and on this data the gap is large enough that
        # printing it alone would mislead: a head measured at 45% cross-validated
        # accuracy returned 0.9887 on a project the corridor evidence showed was
        # actively paving. The measured accuracy travels with the score so a
        # reader cannot see one without the other.
        "confidence_is_calibrated": False,
        "confidence_note": (
            "Softmax margin of the linear head, not a calibrated probability. "
            "The head's measured cross-validated accuracy is "
            + (f"{cv:.1%}" if isinstance(cv, (int, float)) else "unmeasured")
            + "; read that as the reliability of this phase, not the score above."),
        "measured_cv_accuracy": cv,
        "embedding_source": source,
        "head_inference_ms": round(head_ms, 3),
        "foundation_backbone": BACKBONE_ID,
        "agrees_with_rule": bool(phase == rule_phase),
        "class_probabilities": {c: round(float(p), 4)
                                for c, p in zip(head.classes, probs)},
        "backbone_status": "loaded",
        "validation": head.validation,
        "trained_at": head.trained_at,
        "n_train": head.n_train,
    })
    if not out["agrees_with_rule"]:
        out["disagreement_note"] = (
            f"The backbone reads '{PHASE_LABEL.get(phase, phase)}' from the "
            f"imagery while the measured chain derives "
            f"'{PHASE_LABEL[rule_phase]}'. Neither is ground truth. A "
            f"disagreement is a prompt to inspect, not a resolved verdict.")
    out["inference_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)
    return out
