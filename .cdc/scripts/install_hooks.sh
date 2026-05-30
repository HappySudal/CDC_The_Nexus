#!/bin/bash
# ============================================================================
# CDC Hook Installer — .cdc/hooks/ → .git/hooks/ 복사
# ============================================================================
# 사용: bash .cdc/scripts/install_hooks.sh
# 또는: pwsh .cdc/scripts/install_hooks.ps1
#
# Hook 원본은 .cdc/hooks/에 git 추적됨. 본 스크립트가 .git/hooks/로 복사하여
# 실제 git 작업 시 활성화. 신규 PC 동기화 후 1회 실행 필요.
# ============================================================================

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
    echo "❌ git 저장소 루트를 찾을 수 없습니다."
    exit 2
fi

SRC_DIR="$REPO_ROOT/.cdc/hooks"
DST_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$SRC_DIR" ]; then
    echo "❌ Hook 원본 디렉토리($SRC_DIR)가 없습니다."
    exit 2
fi

echo "[CDC] Hook 설치 시작"
echo "       Source: $SRC_DIR"
echo "       Target: $DST_DIR"
echo ""

INSTALLED=0
for SRC in "$SRC_DIR"/*; do
    [ -e "$SRC" ] || continue
    NAME="$(basename "$SRC")"
    DST="$DST_DIR/$NAME"

    if [ -e "$DST" ]; then
        BACKUP="$DST.bak.$(date +%Y%m%d_%H%M%S)"
        echo "  ⚠️  기존 $NAME 존재 → 백업: $BACKUP"
        cp "$DST" "$BACKUP"
    fi

    cp "$SRC" "$DST"
    chmod +x "$DST" 2>/dev/null || true
    echo "  ✅ Installed: $NAME"
    INSTALLED=$((INSTALLED + 1))
done

echo ""
echo "[CDC] $INSTALLED 개 hook 설치 완료"
exit 0

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
