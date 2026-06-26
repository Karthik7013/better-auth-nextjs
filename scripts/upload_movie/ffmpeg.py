import json
import os
import subprocess
import sys
import tempfile


def probe(path: str) -> dict:
    """Get video metadata using ffprobe."""
    cmd = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error probing file: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(result.stdout)
    duration = float(data.get("format", {}).get("duration", 0))

    video_stream = next(
        (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
        None,
    )

    return {
        "duration_seconds": duration,
        "width": int(video_stream.get("width", 0)) if video_stream else 0,
        "height": int(video_stream.get("height", 0)) if video_stream else 0,
        "codec": video_stream.get("codec_name", "unknown") if video_stream else "unknown",
        "bitrate": int(data.get("format", {}).get("bit_rate", 0) or 0),
        "size": os.path.getsize(path),
    }


def transcode(
    input_path: str,
    output_path: str | None = None,
    crf: int = 23,
    max_resolution: int | None = None,
) -> str:
    """Transcode video to optimized MP4 with faststart for streaming."""
    if output_path is None:
        base = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(tempfile.gettempdir(), f"{base}_optimized.mp4")

    cmd = [
        "ffmpeg",
        "-i",
        input_path,
        "-c:v",
        "libx264",
        "-crf",
        str(crf),
        "-preset",
        "medium",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        "-v",
        "error",
        "-stats",
    ]

    if max_resolution:
        cmd.extend(["-vf", f"scale=-2:{max_resolution}"])

    cmd.append(output_path)

    original_size = os.path.getsize(input_path)
    print(f"Original: {original_size / (1024*1024):.1f} MB", file=sys.stderr)
    print(f"CRF: {crf}  |  Preset: medium", file=sys.stderr)
    if max_resolution:
        print(f"Max resolution: {max_resolution}p", file=sys.stderr)
    print(file=sys.stderr)

    result = subprocess.run(cmd)

    if result.returncode != 0:
        print(f"Transcoding failed (exit code {result.returncode})", file=sys.stderr)
        sys.exit(1)

    optimized_size = os.path.getsize(output_path)
    ratio = (1 - optimized_size / original_size) * 100
    print(file=sys.stderr)
    print(f"Optimized: {optimized_size / (1024*1024):.1f} MB  ({ratio:.0f}% smaller)", file=sys.stderr)

    return output_path
