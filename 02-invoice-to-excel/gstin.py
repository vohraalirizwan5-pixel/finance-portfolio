"""
GSTIN validation using the official check-digit (checksum) rule.

A GSTIN has 15 characters:
  27        ABCPG4521L   1             Z        5
  state     PAN          entity no.    always Z check digit

The last character is calculated from the first 14. If someone types one
character wrong, the check digit won't match, so we can catch typos.
"""
import re

CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
GSTIN_PATTERN = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")


def check_digit(first14: str) -> str:
    total = 0
    for i, ch in enumerate(first14):
        factor = 1 if i % 2 == 0 else 2
        product = CHARS.index(ch) * factor
        total += product // 36 + product % 36
    return CHARS[(36 - total % 36) % 36]


def is_valid_gstin(gstin: str) -> bool:
    if not gstin or not GSTIN_PATTERN.match(gstin):
        return False
    return check_digit(gstin[:14]) == gstin[14]


def make_valid_gstin(state: str, pan: str, entity: str = "1") -> str:
    first14 = f"{state}{pan}{entity}Z"
    return first14 + check_digit(first14)
