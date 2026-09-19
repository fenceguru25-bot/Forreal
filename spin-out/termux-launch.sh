#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"

mkdir -p "${ROOT_DIR}/data"

if [ ! -d "${VENV_DIR}" ]; then
  python -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

python -m pip install --upgrade pip
python -m pip install -r "${ROOT_DIR}/requirements-python.txt"

export PORT="${PORT:-4000}"
export HOST="${HOST:-0.0.0.0}"
export SPIN_OUT_DB_PATH="${SPIN_OUT_DB_PATH:-${ROOT_DIR}/data/spin_out.db}"

echo "Launching Spin Out on http://127.0.0.1:${PORT}"
echo "Database: ${SPIN_OUT_DB_PATH}"

python "${ROOT_DIR}/python_runtime.py"
