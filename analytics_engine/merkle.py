"""
PRAKALP-DRISHTI: RFC 6962 MERKLE PRIMITIVES

The single Merkle implementation in this system. Both the briefing lineage
(pragati_saarthi.py) and the corpus content address (corpus_provenance.py) build on
these functions, so there is exactly one construction to audit and exactly one place a
defect could hide.

Why RFC 6962 specifically
-------------------------
Two defects in a naive Merkle tree, both of which weaken precisely the property a CAG
reviewer relies on -- "this root proves these facts":

  1. NO DOMAIN SEPARATION. If leaves are sha256(data) and internal nodes are
     sha256(left||right), the two are drawn from the same hash domain, so an attacker
     able to choose inputs can present an internal node as though it were a leaf.
     RFC 6962 s2.1 prefixes every leaf with 0x00 and every internal node with 0x01, so
     the two families can never collide.

  2. ODD-NODE DUPLICATION. Hashing the last node of an odd level against itself is
     CVE-2012-2459: two different leaf sets yield an identical root, so a matching root
     stops proving anything. RFC 6962 splits at the largest power of two below n, which
     is unambiguous for every n and needs no duplication.

Wire format
-----------
Roots and sibling hashes are lowercase 64-char hex. Inclusion proofs are
[{"hash": <hex>, "position": "left"|"right"}] ordered deepest-sibling-first, where
"position" names the side the SIBLING sits on. This is the format already persisted in
archived briefings, so it is fixed.
"""

from __future__ import annotations

import hashlib
from typing import Dict, List

_LEAF_PREFIX = b"\x00"
_NODE_PREFIX = b"\x01"


def mth_leaf(data: str) -> str:
    """RFC 6962 leaf hash: SHA-256(0x00 || data)."""
    return hashlib.sha256(_LEAF_PREFIX + data.encode("utf-8")).hexdigest()


def mth_node(left_hex: str, right_hex: str) -> str:
    """RFC 6962 internal node: SHA-256(0x01 || left || right) over the raw digests."""
    return hashlib.sha256(
        _NODE_PREFIX + bytes.fromhex(left_hex) + bytes.fromhex(right_hex)
    ).hexdigest()


def split_point(n: int) -> int:
    """k = the largest power of two strictly less than n (RFC 6962 s2.1)."""
    k = 1
    while k * 2 < n:
        k *= 2
    return k


def mth(leaf_hashes: List[str]) -> str:
    """Merkle Tree Hash over already-hashed leaves."""
    n = len(leaf_hashes)
    if n == 0:
        # RFC 6962: MTH({}) = SHA-256() -- the hash of the empty string.
        return hashlib.sha256(b"").hexdigest()
    if n == 1:
        return leaf_hashes[0]
    k = split_point(n)
    return mth_node(mth(leaf_hashes[:k]), mth(leaf_hashes[k:]))


def mth_path(m: int, leaf_hashes: List[str]) -> List[Dict[str, str]]:
    """
    RFC 6962 s2.1.1 inclusion path for leaf index m, ordered deepest sibling first so a
    verifier can fold it straight from the leaf upward.
    """
    n = len(leaf_hashes)
    if n <= 1:
        return []
    k = split_point(n)
    if m < k:
        return mth_path(m, leaf_hashes[:k]) + [
            {"hash": mth(leaf_hashes[k:]), "position": "right"}]
    return mth_path(m - k, leaf_hashes[k:]) + [
        {"hash": mth(leaf_hashes[:k]), "position": "left"}]


def build_tree(leaves: List[str]):
    """(root, {leaf_hash: inclusion_proof}) over raw leaf STRINGS."""
    if not leaves:
        return mth([]), {}
    leaf_hashes = [mth_leaf(leaf) for leaf in leaves]
    root = mth(leaf_hashes)
    proofs = {lh: mth_path(i, leaf_hashes) for i, lh in enumerate(leaf_hashes)}
    return root, proofs


def verify_inclusion_proof(leaf_str_or_hash: str,
                           proof: List[Dict[str, str]],
                           expected_root: str) -> bool:
    """
    Recompute the root from a leaf plus its positional siblings.

    Fails CLOSED: a malformed proof (non-hex sibling, wrong length, wrong type) is a
    verification FAILURE, never an exception. This is the endpoint an auditor points at
    a briefing they already suspect, so it must return False rather than 500.
    """
    try:
        leaf_str_or_hash = str(leaf_str_or_hash)
        if (len(leaf_str_or_hash) == 64
                and all(c in "0123456789abcdefABCDEF" for c in leaf_str_or_hash)):
            curr = leaf_str_or_hash.lower()
        else:
            curr = mth_leaf(leaf_str_or_hash)

        for step in proof:
            sibling = str(step.get("hash", step.get("sibling", ""))).lower()
            if step.get("position", "right") == "left":
                curr = mth_node(sibling, curr)
            else:
                curr = mth_node(curr, sibling)

        return curr.lower() == str(expected_root).lower()
    except (ValueError, TypeError, AttributeError):
        return False
