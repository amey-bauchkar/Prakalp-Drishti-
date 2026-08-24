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

    env = os.environ.copy()
    env["PYTHONPATH"] = BASE_DIR + os.pathsep + env.get("PYTHONPATH", "")

    for test_file in TESTS:
        test_path = os.path.join(tests_dir, test_file)
        if not os.path.exists(test_path):
            continue

        print(f"\n>> Running: {test_file} ...")
        res = subprocess.run([sys.executable, test_path], cwd=BASE_DIR, env=env, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"  [PASS] {test_file}")
            passed += 1
        else:
            print(f"  [FAIL] {test_file}")
            print(res.stdout)
            print(res.stderr)
            failed += 1

    print("\n" + "=" * 80)
    print(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED")
    print("=" * 80)

    if failed > 0:
        sys.exit(1)
    else:
        print("ALL TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    main()
