"""Query ARM's authenticated file catalog without retaining credential-bearing URLs."""

import argparse
import getpass
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.dont_write_bytecode = True
from evidence import Run


def main():
    """Check selected raw-count streams required by the saturation notice."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--username", required=True)
    args = parser.parse_args()
    token = getpass.getpass("ARM access token (not echoed or retained): ").strip()
    if not token or any(character in args.username + token for character in ":\r\n\0"):
        raise ValueError("Invalid credentials")
    authorization = args.username + ":" + token
    with Run("raw-query", ["query.py"], "Authenticated raw-count file availability; no credentials retained") as run:
        records = []
        for datastream in ["sgpsaszevisC1.a0", "sgpsaszeC1.00"]:
            params = {"user": authorization, "ds": datastream, "start": "2023-08-22", "end": "2023-08-23", "wt": "json"}
            url = "https://adc.arm.gov/armlive/query?" + urllib.parse.urlencode(params)
            record = {"datastream": datastream, "start": params["start"], "end": params["end"],
                      "endpoint": "https://adc.arm.gov/armlive/query"}
            try:
                with urllib.request.urlopen(url, timeout=30) as response:
                    raw = response.read(1024 * 1024)
                data = json.loads(raw)
                # Select only file names. Never persist full responses or download URLs.
                record["providerStatus"] = str(data.get("status", ""))[:50]
                record["files"] = [value for value in data.get("files", [])
                                   if isinstance(value, str) and value.startswith(datastream + ".")
                                   and not any(character in value for character in "/?&:\r\n")]
            except urllib.error.HTTPError as error:
                record["httpStatus"] = error.code
            except Exception as error:
                record["errorType"] = type(error).__name__
            records.append(record)
            print(json.dumps(record), flush=True)
        run.json("result.json", {"records": records, "scope": "Provider-reported availability only"})
    token, authorization = "", ""


if __name__ == "__main__":
    main()
