#!/bin/bash
# setup-nvidia-launchers.sh
# One-time setup for NVIDIA-powered app launchers (Terminal + GUI) on Parrot OS

echo "🚀 Setting up NVIDIA app launchers..."

# Ensure ~/bin exists and is in PATH
mkdir -p ~/bin
if ! grep -q "$HOME/bin" <<< "$PATH"; then
    echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
fi

# === Terminal launcher commands ===
declare -A cmds=(
    ["nvidia-blender"]="prime-run blender \"\$@\""
    ["nvidia-code"]="prime-run code \"\$@\""
    ["nvidia-androidstudio"]="prime-run studio.sh \"\$@\""
    ["nvidia-emulator"]="prime-run emulator \"\$@\""
    ["nvidia-flutteremulator"]="prime-run flutter emulators --launch MyDevice \"\$@\""
)

for cmd in "${!cmds[@]}"; do
    cat << EOF > ~/bin/$cmd
#!/bin/bash
${cmds[$cmd]}
EOF
    chmod +x ~/bin/$cmd
done

# === GUI .desktop launchers ===
mkdir -p ~/.local/share/applications

cat << EOF > ~/.local/share/applications/blender-nvidia.desktop
[Desktop Entry]
Name=Blender (NVIDIA)
Exec=nvidia-blender
Icon=blender
Type=Application
Categories=Graphics;
EOF

cat << EOF > ~/.local/share/applications/code-nvidia.desktop
[Desktop Entry]
Name=VS Code (NVIDIA)
Exec=nvidia-code
Icon=code
Type=Application
Categories=Development;
EOF

cat << EOF > ~/.local/share/applications/androidstudio-nvidia.desktop
[Desktop Entry]
Name=Android Studio (NVIDIA)
Exec=nvidia-androidstudio
Icon=androidstudio
Type=Application
Categories=Development;
EOF

cat << EOF > ~/.local/share/applications/emulator-nvidia.desktop
[Desktop Entry]
Name=Android Emulator (NVIDIA)
Exec=nvidia-emulator -avd MyDevice
Icon=emulator
Type=Application
Categories=Development;
EOF

cat << EOF > ~/.local/share/applications/flutteremulator-nvidia.desktop
[Desktop Entry]
Name=Flutter Emulator (NVIDIA)
Exec=nvidia-flutteremulator
Icon=flutter
Type=Application
Categories=Development;
EOF

echo "✅ NVIDIA launchers installed!"
echo "➡ Terminal commands: nvidia-blender, nvidia-code, nvidia-androidstudio, nvidia-emulator, nvidia-flutteremulator"
echo "➡ GUI apps: Blender (NVIDIA), VS Code (NVIDIA), Android Studio (NVIDIA), Emulator (NVIDIA), Flutter Emulator (NVIDIA)"
echo "➡ Restart your session or run: source ~/.bashrc"
