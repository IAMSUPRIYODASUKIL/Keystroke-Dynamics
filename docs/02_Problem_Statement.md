# 02 — Problem Statement

## The limits of "something you know"

Password authentication is built entirely around a shared secret: if the string
presented matches the string on record, access is granted. This design has three
structural weaknesses that no amount of password-policy tightening fixes:

1. **A correct password proves nothing about who is entering it.** Passwords are
   guessed, phished, reused across breached sites, written down, or shared. Once an
   attacker has the string, they authenticate indistinguishably from the real owner.
2. **Passwords carry no behavioral information.** The system has no way to notice "this
   is the right password, but it was just entered in a way this account has never been
   entered before" — every correct entry looks identical to the system, regardless of
   who typed it.
3. **A single factor is a single point of failure.** If the password is compromised,
   there is no second signal to catch the misuse.

Traditional multi-factor authentication (OTP, hardware tokens, push approval) helps,
but adds friction — a code to type, a device to have on hand — and still only checks
possession or knowledge, not behavior.

## The opportunity

Typing is a motor skill. Like handwriting or gait, each person develops habitual,
partly-unconscious timing patterns: how long they hold down the "e" key, how quickly
they move from "t" to "h", their overall typing speed. These patterns are not secret —
they can't be "phished" the way a password can — but they are hard to *deliberately and
consistently* imitate, especially in real time during a live login attempt.

## What this project addresses

This project asks and answers, with a working implementation rather than only theory:

- Can typing rhythm for a **fixed phrase** be captured reliably in a browser?
- Can meaningful, non-arbitrary numeric features be extracted from that raw timing?
- Can classical, interpretable machine learning models tell one person's typing rhythm
  apart from another's, using only a realistically small number of enrollment samples?
- Can that model be wired into an actual login flow, producing a clear, honest,
  explainable authentication decision — without ever claiming keystroke dynamics alone
  is a substitute for the password?

The scope is deliberately an **additional layer**, not a replacement: the password
remains mandatory and is checked first; typing behavior is a secondary signal that
adjusts risk and can, depending on configuration, block a login even with a correct
password. See [10_Security.md](10_Security.md) for how the two checks combine, and
[12_Limitations.md](12_Limitations.md) for what this approach does *not* solve.
