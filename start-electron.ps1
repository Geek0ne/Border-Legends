# 启动边境传说桌面客户端（Electron）
Write-Host ""
============================================"" -ForegroundColor Cyan
Write-Host ""  边境传说 - Border Legends (Electron)"" -ForegroundColor Yellow
Write-Host ""============================================"" -ForegroundColor Cyan
Write-Host ""
[1/3] 构建游戏网页资源..."" -ForegroundColor Cyan
npm run build
if ( -ne 0) { Write-Host ""[ERROR] 网页构建失败"" -ForegroundColor Red; exit 1 }
Write-Host ""[OK] 网页构建完成"" -ForegroundColor Green

Write-Host ""
[2/3] 构建 Electron 主进程..."" -ForegroundColor Cyan
npm run electron:build
if ( -ne 0) { Write-Host ""[ERROR] Electron 构建失败"" -ForegroundColor Red; exit 1 }
Write-Host ""[OK] Electron 构建完成"" -ForegroundColor Green

Write-Host ""
[3/3] 启动 Electron 客户端..."" -ForegroundColor Cyan
Write-Host ""
正在打开边境传说..."" -ForegroundColor Green
npm run electron
