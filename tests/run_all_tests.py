"""
PRAKALP-DRISHTI: Master Test Runner
Executes all analytical, optimization, and cryptographic test suites.
"""

import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

TESTS = [
    "test_satya_kavach.py",
    "test_round3_fixes.py",
    "test_vitta_complete.py",
    "test_risk_model.py",
    "test_dynamic_kappa.py",
    "test_effective_yield.py",
    "test_agency_index.py",
]

def main():
    print("=" * 80)
    print("PRAKALP-DRISHTI: EXECUTING FULL TEST SUITE")
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
        proved = "ASSERTIONS PASSED" in (res.stdout or "")
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
