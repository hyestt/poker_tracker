import json
import os
import sys
import urllib.request
import urllib.error


def call_openai_responses(model: str, prompt: str, max_output_tokens: int = 800) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set in environment")

    url = "https://api.openai.com/v1/responses"
    payload = {
        "model": model,
        "input": prompt,
        "max_output_tokens": max_output_tokens,
        # Try to bias toward emitting text quickly
        "reasoning": {"effort": "low"},
        "text": {"format": {"type": "text"}, "verbosity": "low"},
    }

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")

    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            err_body = ""
        raise RuntimeError(f"HTTP {e.code}: {err_body}")


def extract_text_from_response(r: dict) -> str:
    # Aggregated text may be present as output_text in some server responses
    if isinstance(r, dict):
        if "output_text" in r and isinstance(r["output_text"], str) and r["output_text"].strip():
            return r["output_text"].strip()

        # Otherwise aggregate from output items if available
        out_items = r.get("output") or []
        texts = []
        for item in out_items:
            # Some items may be of type 'message' containing content segments
            if item.get("type") == "message":
                for c in item.get("content", []):
                    if c.get("type") == "output_text" and isinstance(c.get("text"), str):
                        texts.append(c["text"]) 
            # Some servers may return direct 'text' fields
            if item.get("type") == "output_text" and isinstance(item.get("text"), str):
                texts.append(item["text"])
        joined = "\n".join(t.strip() for t in texts if t and t.strip())
        if joined:
            return joined
    return ""


def main():
    model = sys.argv[1] if len(sys.argv) > 1 else "gpt-5o"
    max_tokens = int(sys.argv[2]) if len(sys.argv) > 2 else 800
    mode = sys.argv[3] if len(sys.argv) > 3 else "hand"  # "ok" or "hand"

    if mode == "ok":
        prompt = "Reply ONLY with OK"
    else:
        hand_details = (
            "Position: CO\n"
            "Hole Cards: A♥ A♦\n"
            "Board: K♦ 7♣ 2♥ 9♠ 9♦\n"
            "Villains: 1\n"
            "Action: Preflop raise to 3bb, BTN calls; Flop bet 1/2 pot, call; Turn check-check; River bet 1/2 pot, call"
        )
        prompt = (
            "You are a professional Texas Hold'em GTO coach.\n"
            "Analyze the following hand and respond in STRICT JSON with keys: summary, line, notes.\n"
            "No prose outside JSON.\n\n"
            f"HAND:\n{hand_details}\n\n"
            "Return concise JSON only."
        )

    try:
        resp = call_openai_responses(model, prompt, max_output_tokens=max_tokens)
    except Exception as e:
        print(json.dumps({"model": model, "error": str(e)}))
        return

    text = extract_text_from_response(resp)
    output = {
        "model": model,
        "status": resp.get("status"),
        "reason": (resp.get("incomplete_details") or {}).get("reason"),
        "output_text": text,
        "raw_truncated": json.dumps(resp)[:1200],
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()


