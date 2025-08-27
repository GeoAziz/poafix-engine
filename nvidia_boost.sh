#!/bin/bash
set -e

SWAP_SIZE_GB=8
SWAP_FILE="/swapfile"

FS_TYPE=$(findmnt -n -o FSTYPE /)
echo "[INFO] Detected filesystem: $FS_TYPE"

create_swap() {
    echo "[INFO] Creating ${SWAP_SIZE_GB}GB swapfile at $SWAP_FILE"
    sudo swapoff -a 2>/dev/null || true
    sudo rm -f "$SWAP_FILE"

    if [[ "$FS_TYPE" == "btrfs" || "$FS_TYPE" == "zfs" ]]; then
        echo "[INFO] Using dd (btrfs/zfs compatible)"
        sudo dd if=/dev/zero of=$SWAP_FILE bs=1M count=$((SWAP_SIZE_GB*1024)) status=progress
    else
        echo "[INFO] Using fallocate (faster)"
        sudo fallocate -l ${SWAP_SIZE_GB}G $SWAP_FILE
    fi

    sudo chmod 600 $SWAP_FILE
    sudo mkswap $SWAP_FILE
    sudo swapon $SWAP_FILE
    if ! grep -q "$SWAP_FILE" /etc/fstab; then
        echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab
    fi
    echo "[SUCCESS] Swapfile created and activated."
}

if free | awk '/^Swap:/ {exit !$2}'; then
    echo "[INFO] Swap is already active. Skipping swap creation."
else
    create_swap
fi

echo "[INFO] Applying NVIDIA performance mode..."
sudo nvidia-smi -pm 1
sudo nvidia-smi --auto-boost-default=0
sudo nvidia-smi -lgc 900,1500
echo "[SUCCESS] NVIDIA boost applied."
