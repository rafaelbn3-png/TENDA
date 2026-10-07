# Passeio 360° — teste no navegador

Esta é a primeira versão WebXR do passeio do apartamento. Ela funciona no desktop com mouse, no celular usando o giroscópio e no Meta Quest 3 pelo botão **Enter VR**.

Para gerar um aplicativo nativo instalável no Quest, foi criada a base Unity em `Quest360Unity`.

## Executar no computador

Abra o PowerShell nesta pasta e execute:

```powershell
node server.mjs
```

Abra `http://localhost:4173` no computador. Para usar no Quest, publique esta pasta em um host HTTPS, como GitHub Pages, Netlify ou Vercel, e abra a URL no navegador do headset. O endereço HTTP local não é suficiente para ativar WebXR no Quest.

## Testar no celular

Publique a pasta em HTTPS e abra o endereço no navegador do celular. Toque em **Ativar movimento do celular** e aceite a permissão de sensores. No iPhone, a permissão precisa ser solicitada por esse toque; no Android, confirme também que o navegador tem acesso aos sensores. Se o movimento não estiver disponível, ainda é possível arrastar a imagem com o dedo.

## Testar no Quest 3

Abra o navegador Meta Quest e acesse a URL HTTPS. Clique em **Enter VR**. Aponte o controle para um ícone e pressione o gatilho. O menu inferior também permite trocar diretamente de ambiente.

## Observações

- A troca de ambiente é feita somente pelos botões do rodapé.
- No modo VR, o controle direito usa A para avançar e B para voltar. No controle esquerdo, Y avança e X volta.
- Esta versão usa os arquivos existentes em `APARTAMENTO` e não envia os renders para nenhum servidor externo além do servidor que você executar.
