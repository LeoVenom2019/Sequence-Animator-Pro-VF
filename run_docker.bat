@echo off
echo ===================================================
echo [SAP] INICIANDO WORKFLOW ZERO-BUROCRACIA DOCKER...
echo ===================================================

:: 1. Parar e remover conteineres antigos com o mesmo nome para evitar erros
echo [1/4] Limpando conteineres anteriores (se houver)...
docker stop sequence-animator >nul 2>&1
docker rm sequence-animator >nul 2>&1

:: 2. Buildar a imagem Docker do SAP
echo [2/4] Compilando imagem Docker local 'sap-app' (isso pode levar de 1 a 2 minutos no primeiro run)...
docker build -t sap-app .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] O build do Docker falhou! Verifique se o Docker Desktop esta aberto e rodando.
    pause
    exit /b %ERRORLEVEL%
)

:: 3. Rodar o conteiner na porta 3001
echo [3/4] Inicializando o conteiner na porta 3001...
docker run -d -p 3001:3001 --name sequence-animator --restart unless-stopped sap-app

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Nao foi possivel inicializar o conteiner Docker.
    pause
    exit /b %ERRORLEVEL%
)

:: 4. Abrir no navegador padrao automaticamente
echo [4/4] Tudo pronto! Abrindo o Sequence Animator PRO no navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3001

echo ===================================================
echo [SUCESSO] Aplicacao rodando lisa dentro do Docker!
echo URL: http://localhost:3001
echo ===================================================
pause
