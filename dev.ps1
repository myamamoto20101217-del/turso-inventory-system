#!/usr/bin/env pwsh
# 両方のサーバーを同時起動するスクリプト

Write-Host "⚡ 在庫管理システム起動中..." -ForegroundColor Cyan

# APIサーバーとフロントエンドを並行起動
Start-Job -ScriptBlock {
    Set-Location "C:\マリンスポーツオフィス\Turso\packages\api"
    $env:DEV_MODE = "true"
    $env:TURSO_DATABASE_URL = "file:./local.db"
    bun --hot --env-file=.dev.vars src/index.ts
} -Name "API"

Start-Job -ScriptBlock {
    Set-Location "C:\マリンスポーツオフィス\Turso\packages\frontend"
    bun run dev
} -Name "Frontend"

Write-Host ""
Write-Host "✅ サーバー起動中..." -ForegroundColor Green
Write-Host "📡 API: http://localhost:3000" -ForegroundColor Yellow
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Gray
Write-Host ""

# ジョブの出力を表示
Receive-Job -Name "API" -Wait
Receive-Job -Name "Frontend" -Wait
