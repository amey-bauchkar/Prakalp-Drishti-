"""
PRAKALP-DRISHTI: Master Test Runner
Executes all analytical, optimization, and cryptographic test suites.
"""

import os
import re
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Every test file in tests/ that is a standalone script belongs here.
#
# Three files were absent and had rotted unnoticed: test_api.py died on
# KeyError('doc_hash') because RBAC was added after it was written and it never
# sent a token, and test_kappa_sensitivity.py died on ModuleNotFoundError
# because it had no sys.path insert. Both were broken for as long as it took to
# notice, which was "until someone ran them by hand". A runner that silently
# omits files is how a suite reports green while tests are dead, so the list is
# now checked against the directory below.
TESTS = [
    "test_satya_kavach.py",
    "test_satya_kavach_forensic.py",
    "test_round3_fixes.py",
    "test_vitta_complete.py",
    "test_risk_model.py",
    "test_dynamic_kappa.py",
    "test_effective_yield.py",
    "test_agency_index.py",
    "test_api.py",
    "test_janhavi_varsha_speed.py",
    "test_kappa_sensitivity.py",
    "test_a11y_audit.py",
    "test_corpus_provenance.py",
    "test_corpus_schema.py",
    "test_corpus_source.py",
    "test_ingestion.py",
    "test_eo_honesty.py",
    "test_temporal_audit.py",
    "test_showcase_epochs.py",
    "test_math_audit.py",
]

# pytest modules and debug scripts are run separately, not by this runner.
_NOT_STANDALONE = {"test_satellite_precision.py", "verify_features.py",
                   "run_all_tests.py", "debug_cascade.py", "debug_graph.py"}


def _warn_on_unlisted() -> list:
    """Any test_*.py in tests/ that this runner does not execute.

    Reported rather than silently skipped: an unlisted file is a test nobody
    runs, and a test nobody runs is worse than no test because it looks like
    coverage.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    found = {f for f in os.listdir(here)
             if f.startswith("test_") and f.endswith(".py")}
    return sorted(found - set(TESTS) - _NOT_STANDALONE)

def main():
    print("=" * 80)
    print("PRAKALP-DRISHTI: EXECUTING FULL TEST SUITE")
    _unlisted = _warn_on_unlisted()
    if _unlisted:
        print(f"  WARNING: {len(_unlisted)} test file(s) in tests/ are not in "
              f"this runner and are therefore never executed: {_unlisted}")
    print("=" * 80)

    tests_dir = os.path.dirname(os.path.abspath(__file__))
    passed = 0
    failed = 0
    weak = 0

    env = os.environ.copy()
    env["PYTHONPATH"] = BASE_DIR + os.pathsep + env.get("PYTHONPATH", "")

    for test_file in TESTS:
        test_path = os.path.join(tests_dir, test_file)
        if not os.path.exists(test_path):
            continue

        print(f"\n>> Running: {test_file} ...")
        res = subprocess.run([sys.executable, test_path], cwd=BASE_DIR, env=env,
                             capture_output=True, text=True)

        # A zero exit code is necessary but not sufficient. Every file in this
        # suite was once a print-script with no assert in it, so "PASSED" only
        # ever meant "did not raise" — an empty result set, an inverted risk dial
        # or a breached budget all reported success. Each hardened file ends with
        # an explicit ASSERTIONS PASSED line; its absence is surfaced as WEAK so
        # a test cannot quietly regress into printing again.
        # Two accepted proofs, because there are two legitimate ways to assert
        # here and recognising only one produced a FALSE weak report:
        # test_janhavi_varsha_speed.py runs 5 real unittest assertions and was
        # flagged as asserting nothing, which is exactly the mislabel this
        # detector exists to prevent, pointing the other way.
        #
        # unittest writes its summary to stderr and exits non-zero on any
        # failure, so "Ran N tests ... OK" is as strong a guarantee as the
        # explicit sentinel.
        _out = (res.stdout or "") + (res.stderr or "")
        proved = ("ASSERTIONS PASSED" in _out
                  or bool(re.search(r"Ran \d+ tests?\b[\s\S]{0,80}\bOK\b", _out)))
        if res.returncode == 0 and proved:
            print(f"  [PASS] {test_file}")
            passed += 1
        elif res.returncode == 0:
            print(f"  [WEAK] {test_file} - exited 0 but asserted nothing")
            weak += 1
        else:
            print(f"  [FAIL] {test_file}")
            print(res.stdout)
            print(res.stderr)
            failed += 1

    print("\n" + "=" * 80)
    print(f"TEST SUMMARY: {passed} PASSED (with assertions), "
          f"{weak} WEAK (no assertions), {failed} FAILED")
    print("=" * 80)

    if failed > 0:
        sys.exit(1)
    if weak > 0:
        # Not fatal, but never reported as unqualified success. A suite that
        # proves nothing is exactly the failure mode this runner exists to make
        # visible, and printing "ALL TESTS PASSED" over it is how it stayed
        # invisible for so long.
        print(f"\n{weak} file(s) ran without asserting anything. They exercise "
              f"the code but verify no invariant, so this suite does not cover "
              f"them. Add explicit assertions.\n")
        sys.exit(0)
    print("ALL TESTS PASSED WITH EXPLICIT ASSERTIONS.\n")

if __name__ == "__main__":
    main()
