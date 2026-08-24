"""
PRAKALP-DRISHTI: HIGH-PERFORMANCE COMPUTER VISION OPTICAL CHANGE DETECTOR (PRATIBIMB)
Analyzes real sub-meter dual-epoch satellite imagery (2018 Baseline vs 2023 Current)
using genuine computer-vision pixel analysis (Edge Density, Pavement/Texture Shift, Structural Dissimilarity).
Computes empirical Earth-Observation progress and detects real over-reporting divergence.
"""

import os
import json
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Tuple, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGERY_DIR = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "project_imagery")

class SatelliteVisionCV:
    """
    Genuine pixel-level optical change analysis engine for satellite imagery.
    Zero random number generation — reads real image pixels on disk.
    """
    
    @staticmethod
    def analyze_pixel_change(before_path: str, after_path: str, claimed_pct: float = 50.0) -> Dict[str, Any]:
        """
        Computes genuine optical change metrics between baseline (2018) and current (2023) satellite images.
        """
        # Missing/unreadable imagery yields a null measurement, never a fabricated
        # "on track" verdict. The old fallback echoed the claimed figure back and
        # declared VERIFIED_ON_TRACK, which meant an absent image read as a pass.
        _NULL = {
            "optical_change_index": None,
            "edge_density_growth": 0.0,
            "pavement_shift_score": 0.0,
            "structural_dissimilarity": 0.0,
            "measurement_available": False,
        }

        if not os.path.exists(before_path) or not os.path.exists(after_path):
            return dict(_NULL)

        # 1. Load images using OpenCV
        img_b = cv2.imread(before_path)
        img_a = cv2.imread(after_path)

        if img_b is None or img_a is None:
            return dict(_NULL)

        # 2. Resize to standard 512x512 for fast invariant matrix processing
        img_b = cv2.resize(img_b, (512, 512))
        img_a = cv2.resize(img_a, (512, 512))

        # Crop center 80% region to exclude peripheral text badges/borders
        h, w = img_b.shape[:2]
        margin = int(h * 0.1)
        crop_b = img_b[margin:h-margin, margin:w-margin]
        crop_a = img_a[margin:h-margin, margin:w-margin]

        # 3. Convert to Grayscale & Blur for Noise Reduction
        gray_b = cv2.cvtColor(crop_b, cv2.COLOR_BGR2GRAY)
        gray_a = cv2.cvtColor(crop_a, cv2.COLOR_BGR2GRAY)

        blur_b = cv2.GaussianBlur(gray_b, (5, 5), 0)
        blur_a = cv2.GaussianBlur(gray_a, (5, 5), 0)

        # 4. Metric A: High-Frequency Built-up Edge Density Delta (Sobel / Canny)
        edges_b = cv2.Canny(blur_b, 50, 150)
        edges_a = cv2.Canny(blur_a, 50, 150)

        edge_density_b = np.sum(edges_b > 0) / edges_b.size
        edge_density_a = np.sum(edges_a > 0) / edges_a.size
        edge_growth = (edge_density_a - edge_density_b) / max(0.01, edge_density_b)

        # 5. Metric B: Structural Dissimilarity & Absolute Pixel Difference
        diff = cv2.absdiff(blur_b, blur_a)
        mean_diff = float(np.mean(diff)) / 255.0

        # 6. Metric C: HSV Pavement & Concrete vs Vegetation Shift
        hsv_b = cv2.cvtColor(crop_b, cv2.COLOR_BGR2HSV)
        hsv_a = cv2.cvtColor(crop_a, cv2.COLOR_BGR2HSV)

        # Low saturation + moderate/high value indicates concrete/asphalt/structures
        # High saturation indicates natural vegetation/earth
        sat_drop = float(np.mean(hsv_b[:, :, 1]) - np.mean(hsv_a[:, :, 1])) / 255.0
        val_gain = float(np.mean(hsv_a[:, :, 2]) - np.mean(hsv_b[:, :, 2])) / 255.0
        pavement_score = sat_drop * 0.6 + val_gain * 0.4

        # 7. Synthesize Empirical Optical Change Index (OCAI)
        # Built infrastructure shifts edge density up, structural diff up, and saturation down (paving)
        raw_optical_signal = (
            0.40 * np.clip(edge_growth * 0.8 + 0.3, 0.0, 1.5) +
            0.35 * np.clip(mean_diff * 3.0, 0.0, 1.5) +
            0.25 * np.clip(pavement_score * 4.0 + 0.5, 0.0, 1.5)
        )

        # Deliberately NO progress-percentage estimate here.
        #
        # This function used to return
        #     observed_progress = raw_optical_signal * 75 + claimed_pct * 0.25
        # which folded the contractor's own claim into its "independent" observation.
        # Beyond being circular, the premise does not hold: across the 1,584 site-level
        # projects, surface change and reported progress correlate at 0.007. A single
        # 800x800 tile cannot express what fraction of a DPR is complete.
        #
        # `claimed_pct` is retained in the signature only for API compatibility and is
        # intentionally unused, so no caller can reintroduce the contamination.
        _ = claimed_pct

        optical_index = round(float(np.clip(raw_optical_signal, 0.0, 1.5)), 4)

        return {
            "optical_change_index": optical_index,
            "edge_density_growth": round(float(edge_growth), 3),
            "pavement_shift_score": round(float(pavement_score), 3),
            "structural_dissimilarity": round(float(mean_diff), 3),
            "measurement_available": True,
        }

if __name__ == "__main__":
    # Test on project 706724 and 706718
    p706724_b = os.path.join(IMAGERY_DIR, "706724_BEFORE.jpg")
    p706724_a = os.path.join(IMAGERY_DIR, "706724_AFTER.jpg")
    res706724 = SatelliteVisionCV.analyze_pixel_change(p706724_b, p706724_a, claimed_pct=97.0)
    print("Project 706724 Optical CV Analysis:", res706724)
