// Instalador do Claude Boost para Windows: prepara o computador, instala o Claude Code, faz o login,
// registra o kit desta pasta e abre o assistente no navegador, que instala o resto.
// Compilado com o compilador C# que já vem no Windows (C# 5, .NET Framework 4.x): ver montar.ps1.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Text;
using System.Threading;
using System.Windows.Forms;

class Instalador : Form
{
    static readonly string[] NOMES = {
        "Preparar o computador (Git e Node.js)",
        "Claude Code",
        "Entrar na sua conta do Claude",
        "Registrar o kit Claude Boost",
        "Escolher e instalar (no navegador)",
    };

    readonly Label[] marcas = new Label[NOMES.Length];
    readonly Label[] rotulos = new Label[NOMES.Length];
    readonly TextBox registro = new TextBox();
    readonly Button botao = new Button();
    readonly ProgressBar barra = new ProgressBar();
    readonly string pastaBase = AppDomain.CurrentDomain.BaseDirectory;
    readonly string pastaKit;
    readonly string binLocal = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "bin");
    bool terminou;

    static readonly Color FUNDO = Color.FromArgb(20, 19, 17);
    static readonly Color CARTAO = Color.FromArgb(31, 29, 26);
    static readonly Color TEXTO = Color.FromArgb(240, 233, 220);
    static readonly Color SUAVE = Color.FromArgb(168, 158, 142);
    static readonly Color DESTAQUE = Color.FromArgb(224, 163, 59);

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new Instalador());
    }

    Instalador()
    {
        pastaKit = Path.Combine(pastaBase, "kit");
        Text = "Claude Boost · Instalador";
        Width = 680; Height = 600;
        FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = FUNDO; ForeColor = TEXTO;
        Font = new Font("Segoe UI", 10f);

        var titulo = new Label { Text = "Claude Boost", Font = new Font("Segoe UI Semibold", 20f), ForeColor = TEXTO, AutoSize = true, Left = 28, Top = 22 };
        var sub = new Label { Text = "Vamos deixar o seu Claude pronto. Você só confirma e entra nas suas contas.", ForeColor = SUAVE, AutoSize = true, Left = 30, Top = 64 };
        Controls.Add(titulo); Controls.Add(sub);

        var painel = new Panel { Left = 28, Top = 100, Width = 608, Height = 200, BackColor = CARTAO };
        for (int i = 0; i < NOMES.Length; i++)
        {
            marcas[i] = new Label { Text = "○", Left = 16, Top = 16 + i * 36, Width = 26, Font = new Font("Segoe UI", 12f), ForeColor = SUAVE };
            rotulos[i] = new Label { Text = NOMES[i], Left = 46, Top = 18 + i * 36, Width = 540, ForeColor = TEXTO };
            painel.Controls.Add(marcas[i]); painel.Controls.Add(rotulos[i]);
        }
        Controls.Add(painel);

        barra.Left = 28; barra.Top = 312; barra.Width = 608; barra.Height = 6; barra.Style = ProgressBarStyle.Continuous; barra.Maximum = NOMES.Length;
        Controls.Add(barra);

        registro.Left = 28; registro.Top = 330; registro.Width = 608; registro.Height = 170;
        registro.Multiline = true; registro.ReadOnly = true; registro.ScrollBars = ScrollBars.Vertical;
        registro.BackColor = CARTAO; registro.ForeColor = SUAVE; registro.BorderStyle = BorderStyle.None;
        registro.Font = new Font("Consolas", 9f);
        Controls.Add(registro);

        botao.Text = "Começar"; botao.Left = 496; botao.Top = 512; botao.Width = 140; botao.Height = 36;
        botao.FlatStyle = FlatStyle.Flat; botao.BackColor = DESTAQUE; botao.ForeColor = Color.FromArgb(26, 18, 6);
        botao.FlatAppearance.BorderSize = 0; botao.Font = new Font("Segoe UI Semibold", 10f);
        botao.Click += delegate { if (terminou) Close(); else Comecar(); };
        Controls.Add(botao);

        Escrever("Pasta do kit: " + pastaKit);
        if (!Directory.Exists(pastaKit))
        {
            Escrever("ERRO: não achei a pasta 'kit' ao lado do instalador. Mantenha o .exe dentro da pasta que você recebeu.");
            botao.Enabled = false;
        }
    }

    // ---------- interface (sempre pela thread da janela) ----------
    void NaJanela(Action a) { if (InvokeRequired) Invoke(a); else a(); }

    void Escrever(string linha)
    {
        NaJanela(delegate { registro.AppendText(linha + Environment.NewLine); });
    }

    void Marcar(int i, string simbolo, Color cor)
    {
        NaJanela(delegate { marcas[i].Text = simbolo; marcas[i].ForeColor = cor; rotulos[i].ForeColor = cor == SUAVE ? TEXTO : cor; });
    }

    bool Confirmar(string mensagem)
    {
        var r = DialogResult.No;
        NaJanela(delegate { r = MessageBox.Show(this, mensagem, "Claude Boost", MessageBoxButtons.YesNo, MessageBoxIcon.Question); });
        return r == DialogResult.Yes;
    }

    void Avisar(string mensagem)
    {
        NaJanela(delegate { MessageBox.Show(this, mensagem, "Claude Boost", MessageBoxButtons.OK, MessageBoxIcon.Information); });
    }

    // ---------- processos ----------
    void RecarregarPath()
    {
        string maquina = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.Machine) ?? "";
        string usuario = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User) ?? "";
        Environment.SetEnvironmentVariable("Path", maquina + ";" + usuario + ";" + binLocal, EnvironmentVariableTarget.Process);
    }

    int Rodar(string exe, string argumentos, out string saida, bool mostrarLinhas)
    {
        var info = new ProcessStartInfo(exe, argumentos)
        {
            UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8,
        };
        var tudo = new StringBuilder();
        try
        {
            using (var p = new Process { StartInfo = info })
            {
                DataReceivedEventHandler ler = delegate (object s, DataReceivedEventArgs e)
                {
                    if (e.Data == null) return;
                    lock (tudo) tudo.AppendLine(e.Data);
                    if (mostrarLinhas && e.Data.Trim().Length > 0) Escrever("  " + e.Data);
                };
                p.OutputDataReceived += ler; p.ErrorDataReceived += ler;
                p.Start(); p.BeginOutputReadLine(); p.BeginErrorReadLine();
                p.WaitForExit();
                saida = tudo.ToString();
                return p.ExitCode;
            }
        }
        catch (Exception e)
        {
            saida = e.Message;
            return -1;
        }
    }

    int Rodar(string exe, string argumentos) { string s; return Rodar(exe, argumentos, out s, true); }

    int PowerShell(string script)
    {
        string codificado = Convert.ToBase64String(Encoding.Unicode.GetBytes(script));
        return Rodar("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -EncodedCommand " + codificado);
    }

    bool Tem(string comando) { string s; return Rodar("where.exe", comando, out s, false) == 0; }

    string Claude()
    {
        string local = Path.Combine(binLocal, "claude.exe");
        return File.Exists(local) ? local : "claude";
    }

    // ---------- etapas ----------
    void Comecar()
    {
        botao.Enabled = false;
        botao.Text = "Instalando…";
        var t = new Thread(Trabalhar);
        t.IsBackground = true;
        t.Start();
    }

    void Trabalhar()
    {
        int atual = 0;
        try
        {
            RecarregarPath();
            Action[] etapas = { PrepararBase, InstalarClaude, Entrar, RegistrarKit, AbrirAssistente };
            for (atual = 0; atual < etapas.Length; atual++)
            {
                Marcar(atual, "…", DESTAQUE);
                Escrever("");
                Escrever("== " + NOMES[atual]);
                etapas[atual]();
                Marcar(atual, "✓", Color.FromArgb(76, 195, 138));
                NaJanela(delegate { barra.Value = Math.Min(barra.Maximum, barra.Value + 1); });
            }
            Escrever("");
            Escrever("Pronto! Reabra o app do Claude para ver o tema e o painel Hoje.");
            Avisar("Tudo pronto!\n\nFeche e abra de novo o app do Claude (ou digite /reload-plugins) para ver as personalizações.\n\nComandos: /tema, /painel, /lembrete e /onboarding.");
        }
        catch (Exception e)
        {
            Marcar(atual, "✗", Color.FromArgb(239, 107, 107));
            Escrever("PAROU: " + e.Message);
            Avisar("A instalação parou nesta etapa:\n" + NOMES[atual] + "\n\n" + e.Message + "\n\nVocê pode abrir o instalador de novo: ele continua de onde parou.");
        }
        finally
        {
            terminou = true;
            NaJanela(delegate { botao.Text = "Fechar"; botao.Enabled = true; });
        }
    }

    void PrepararBase()
    {
        if (!Tem("winget"))
        {
            Process.Start("ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1");
            throw new Exception("Falta o 'Instalador de Aplicativo' do Windows (winget). Abri a página dele na Microsoft Store: instale e rode o instalador de novo.");
        }
        string[,] programas = { { "git", "Git.Git", "Git", "o Claude Code usa no Windows" }, { "node", "OpenJS.NodeJS.LTS", "Node.js", "roda o assistente e vários conectores" } };
        for (int i = 0; i < programas.GetLength(0); i++)
        {
            string cmd = programas[i, 0], id = programas[i, 1], nome = programas[i, 2], motivo = programas[i, 3];
            if (Tem(cmd)) { Escrever(nome + ": já instalado."); continue; }
            if (!Confirmar("Falta o " + nome + " (" + motivo + ").\n\nInstalar agora pelo winget? O Windows pode pedir permissão."))
                throw new Exception("Sem o " + nome + " não dá para continuar.");
            Escrever("Instalando " + nome + "…");
            Rodar("winget", "install --id " + id + " -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity");
            RecarregarPath();
            if (!Tem(cmd)) throw new Exception(nome + " não apareceu depois da instalação. Reinicie o computador e rode o instalador de novo.");
        }
    }

    void InstalarClaude()
    {
        if (Tem("claude") || File.Exists(Path.Combine(binLocal, "claude.exe"))) { Escrever("Claude Code: já instalado."); return; }
        if (!Confirmar("Instalar o Claude Code pelo instalador oficial da Anthropic (claude.ai/install.ps1)?"))
            throw new Exception("Sem o Claude Code não dá para continuar.");
        PowerShell("irm https://claude.ai/install.ps1 | iex");
        RecarregarPath();
        if (!Tem("claude") && !File.Exists(Path.Combine(binLocal, "claude.exe")))
            throw new Exception("O Claude Code não apareceu depois da instalação.");
    }

    bool Logado()
    {
        string s;
        Rodar(Claude(), "auth status", out s, false);
        return s.Replace(" ", "").Contains("\"loggedIn\":true");
    }

    void Entrar()
    {
        if (Logado()) { Escrever("Você já está logado no Claude Code."); return; }
        Avisar("Agora você entra na sua conta do Claude.\n\nVai abrir uma janela preta e, em seguida, o navegador. Entre com a sua conta (a mesma da assinatura) e, quando o navegador disser que deu certo, volte e aperte uma tecla na janela preta.");
        var info = new ProcessStartInfo("cmd.exe", "/c \"\"" + Claude() + "\" auth login --claudeai & pause\"") { UseShellExecute = true };
        using (var p = Process.Start(info)) { p.WaitForExit(); }
        if (!Logado()) throw new Exception("O login não foi concluído.");
        Escrever("Login feito.");
    }

    void RegistrarKit()
    {
        string s;
        Rodar(Claude(), "plugin marketplace list --json", out s, false);
        string kitJson = pastaKit.TrimEnd('\\').Replace("\\", "\\\\");
        bool existe = s.Contains("\"name\": \"claude-boost\"");
        bool mesmaPasta = s.Contains(kitJson);
        if (existe && !mesmaPasta)
        {
            if (!Confirmar("Já existe um kit 'claude-boost' no seu Claude, vindo de outro lugar.\n\nTrocar pelo kit desta pasta (a versão mais nova)?"))
                throw new Exception("Mantive o kit antigo; nada foi alterado.");
            Rodar(Claude(), "plugin marketplace remove claude-boost");
            existe = false;
        }
        if (!existe)
        {
            Escrever("Registrando o kit desta pasta…");
            if (Rodar(Claude(), "plugin marketplace add \"" + pastaKit.TrimEnd('\\') + "\"") != 0)
                throw new Exception("Não consegui registrar o kit.");
        }
        else Escrever("Kit já registrado a partir desta pasta.");
        Rodar(Claude(), "plugin install boost-onboarding@claude-boost");
    }

    void AbrirAssistente()
    {
        string script = Path.Combine(pastaKit, "plugins", "boost-onboarding", "scripts", "instalar.mjs");
        string perfil = Path.Combine(pastaBase, "perfil.json");
        string extra = File.Exists(perfil) ? " --respostas \"" + perfil + "\"" : "";
        Escrever("Abrindo o assistente no navegador. Responda, escolha e instale por lá; esta janela espera.");
        int codigo = Rodar("node", "\"" + script + "\"" + extra);
        if (codigo == 2) throw new Exception("O assistente ficou aberto tempo demais sem terminar.");
        if (codigo != 0) throw new Exception("O assistente fechou com erro (código " + codigo + ").");
    }
}
