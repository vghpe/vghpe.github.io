# Define variables
$YOUTUBE_LINK = "https://www.youtube.com/watch?v=QQD-wjeFr10"
$START_TIME = "00:29:22"
$END_TIME = "00:30:10"

# Function to convert HH:MM:SS to seconds
function Convert-TimeToSeconds ($time) {
    $parts = $time.Split(':')
    return [int]$parts[0] * 3600 + [int]$parts[1] * 60 + [int]$parts[2]
}

$START_TIME_SECONDS = Convert-TimeToSeconds -time $START_TIME
$END_TIME_SECONDS = Convert-TimeToSeconds -time $END_TIME

# Define download path
$DESKTOP_PATH = [Environment]::GetFolderPath("Desktop")
$DOWNLOAD_PATH = Join-Path -Path $DESKTOP_PATH -ChildPath "youtube-downloads"

# Create the download folder if it doesn't exist
if (-Not (Test-Path -Path $DOWNLOAD_PATH)) {
    New-Item -Path $DOWNLOAD_PATH -ItemType Directory
}

# Automatic file naming using a simplified timestamp
$TIMESTAMP = (Get-Date).ToString("yyyyMMdd_HHmmss")
$OUTPUT_SEGMENT = "${DOWNLOAD_PATH}\segment_${TIMESTAMP}.mp4"

# Run the yt-dlp command with updated options
yt-dlp `
    $YOUTUBE_LINK `
    --format "bestvideo+bestaudio" `
    --download-sections "*${START_TIME_SECONDS}-${END_TIME_SECONDS}" `
    --output $OUTPUT_SEGMENT `
    --force-keyframes-at-cuts `
    --merge-output-format mp4 `
    --verbose
