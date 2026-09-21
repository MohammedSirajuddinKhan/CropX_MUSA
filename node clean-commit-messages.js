const { spawnSync } = require("child_process");

const pythonScript = String.raw`
import re

def clean_message(message):
    # Decode the commit message as UTF-8.
    text = message.decode("utf-8", errors="replace")

    # Remove "Freebuff:" from the beginning.
    text = re.sub(
        r"^\s*Freebuff:\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Remove "Before:" from the beginning.
    text = re.sub(
        r"^\s*Before:\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Remove standalone 7-digit numbers.
    # Example:
    # 1234567 -> removed
    # abc1234567xyz -> NOT removed
    text = re.sub(
        r"(?<!\d)\d{7}(?!\d)",
        "",
        text
    )

    # Remove the exact "Sync uncommitted changes from freebuff.com"
    # commit message.
    text = re.sub(
        r"^\s*Sync uncommitted changes from freebuff\.com\s*$",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Clean whitespace left behind.
    lines = [line.rstrip() for line in text.splitlines()]
    text = "\n".join(lines).strip()

    # Git commit messages should end with a newline.
    return (text + "\n").encode("utf-8") if text else b"\n"


commit.message = clean_message(commit.message)
`;

console.log("========================================");
console.log(" Git Commit Message Cleaner");
console.log("========================================");
console.log("");
console.log("The following will be removed:");
console.log("  ✓ Freebuff:");
console.log("  ✓ Before:");
console.log("  ✓ Standalone 7-digit numbers");
console.log("  ✓ Sync uncommitted changes from freebuff.com");
console.log("");

const result = spawnSync(
    "git",
    [
        "filter-repo",
        "--force",
        "--commit-callback",
        pythonScript
    ],
    {
        stdio: "inherit",
        shell: process.platform === "win32"
    }
);

if (result.error) {
    console.error("");
    console.error("❌ Failed to run git-filter-repo.");
    console.error("");
    console.error("Make sure git-filter-repo is installed:");
    console.error("");
    console.error("    pip install git-filter-repo");
    console.error("");

    process.exit(1);
}

if (result.status !== 0) {
    console.error("");
    console.error("❌ git-filter-repo failed.");
    process.exit(result.status ?? 1);
}

console.log("");
console.log("========================================");
console.log(" ✅ Commit messages rewritten!");
console.log("========================================");
console.log("");
console.log("Check the result:");
console.log("");
console.log("    git log --oneline --all");
console.log("");

console.log("If this repository was already pushed to GitHub:");
console.log("");
console.log("    git push --force-with-lease origin main");
console.log("");

