// Spark: o instalador do Spark para Windows. Prepara o computador, instala o Claude Code, faz o login,
// registra o kit desta pasta e abre o assistente no navegador, que instala o resto.
// Compilado com o compilador C# que já vem no Windows (C# 5, .NET Framework 4.x): ver montar.ps1.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

class Instalador : Form
{
    static readonly string[] NOMES = {
        "Preparar o computador (Git e Node.js)",
        "Claude Code",
        "Entrar na sua conta do Claude",
        "Registrar o kit Spark",
        "Escolher e instalar (no navegador)",
    };

    readonly Etapas etapas = new Etapas(NOMES);
    readonly TextBox registro = new TextBox();
    readonly Botao botao = new Botao();
    readonly Label detalhes = new Label();
    readonly Barra barra = new Barra();
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

    // Tudo escuro: barra de título (Windows 10 20H1+ e 11) e barra de rolagem.
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int atributo, ref int valor, int tamanho);
    [DllImport("uxtheme.dll", CharSet = CharSet.Unicode)] static extern int SetWindowTheme(IntPtr h, string app, string lista);

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        int sim = 1;
        try { if (DwmSetWindowAttribute(Handle, 20, ref sim, 4) != 0) DwmSetWindowAttribute(Handle, 19, ref sim, 4); } catch { }
    }

    // O ícone vai embutido no .exe (montar.ps1 passa /resource:icone.ico e icone.png).
    static Stream Recurso(string nome)
    {
        return Assembly.GetExecutingAssembly().GetManifestResourceStream(nome);
    }

    Instalador()
    {
        pastaKit = Path.Combine(pastaBase, "kit");
        Text = "Spark · Instalação";
        var ico = Recurso("Spark.icone.ico");
        if (ico != null) Icon = new Icon(ico);
        ClientSize = new Size(640, 560);
        FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = FUNDO; ForeColor = TEXTO;
        Font = new Font("Segoe UI", 10f);
        DoubleBuffered = true;

        // Cabeçalho: degradê quente com o ícone e uma linha de brilho âmbar embaixo.
        var png = Recurso("Spark.icone.png");
        var cabeca = new Cabecalho(png != null ? Image.FromStream(png) : null) { Left = 0, Top = 0, Width = 640, Height = 120 };
        Controls.Add(cabeca);

        etapas.Left = 28; etapas.Top = 140; etapas.Width = 584; etapas.Height = NOMES.Length * 52 + 12;
        Controls.Add(etapas);

        barra.Left = 28; barra.Top = etapas.Bottom + 16; barra.Width = 584; barra.Height = 6; barra.Maximum = NOMES.Length;
        Controls.Add(barra);

        detalhes.Text = "▸ Ver detalhes"; detalhes.AutoSize = true; detalhes.Left = 26; detalhes.Top = barra.Bottom + 14;
        detalhes.ForeColor = SUAVE; detalhes.Cursor = Cursors.Hand;
        detalhes.Click += delegate { MostrarDetalhes(!registro.Visible); };
        Controls.Add(detalhes);

        registro.Left = 28; registro.Top = detalhes.Bottom + 8; registro.Width = 584; registro.Height = 150;
        registro.Multiline = true; registro.ReadOnly = true; registro.ScrollBars = ScrollBars.Vertical;
        registro.BackColor = CARTAO; registro.ForeColor = SUAVE; registro.BorderStyle = BorderStyle.None;
        registro.Font = new Font("Consolas", 9f); registro.Visible = false;
        registro.HandleCreated += delegate { SetWindowTheme(registro.Handle, "DarkMode_Explorer", null); };
        Controls.Add(registro);

        var rodape = new Label { Text = "Nada é instalado sem o seu OK. Senhas e chaves nunca passam pelo chat.", ForeColor = Color.FromArgb(120, 112, 100), AutoSize = true, Font = new Font("Segoe UI", 8.5f) };
        Controls.Add(rodape);

        botao.Text = "Começar"; botao.Width = 150; botao.Height = 40;
        botao.Click += delegate { if (terminou) Close(); else Comecar(); };
        Controls.Add(botao);
        PosicionarRodape(rodape);
        Resize += delegate { PosicionarRodape(rodape); };

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
        int estado = simbolo == "✓" ? 2 : simbolo == "✗" ? 3 : simbolo == "…" ? 1 : 0;
        NaJanela(delegate { etapas.Definir(i, estado); });
    }

    void MostrarDetalhes(bool mostrar)
    {
        registro.Visible = mostrar;
        detalhes.Text = mostrar ? "▾ Esconder detalhes" : "▸ Ver detalhes";
        ClientSize = new Size(640, mostrar ? 720 : 560);
    }

    void PosicionarRodape(Label rodape)
    {
        botao.Left = ClientSize.Width - 28 - botao.Width; botao.Top = ClientSize.Height - 24 - botao.Height;
        rodape.Left = 28; rodape.Top = botao.Top + (botao.Height - rodape.Height) / 2;
    }

    bool Confirmar(string mensagem)
    {
        var r = DialogResult.No;
        NaJanela(delegate { r = MessageBox.Show(this, mensagem, "Spark", MessageBoxButtons.YesNo, MessageBoxIcon.Question); });
        return r == DialogResult.Yes;
    }

    void Avisar(string mensagem)
    {
        NaJanela(delegate { MessageBox.Show(this, mensagem, "Spark", MessageBoxButtons.OK, MessageBoxIcon.Information); });
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
            NaJanela(delegate { MostrarDetalhes(true); });
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


// ---------- desenho da janela ----------
static class Desenho
{
    public static System.Drawing.Drawing2D.GraphicsPath Arredondado(RectangleF r, float raio)
    {
        var p = new System.Drawing.Drawing2D.GraphicsPath();
        float d = Math.Max(1f, raio * 2);
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }
    public static readonly Color FUNDO = Color.FromArgb(20, 19, 17);
    public static readonly Color CARTAO = Color.FromArgb(31, 29, 26);
    public static readonly Color TEXTO = Color.FromArgb(240, 233, 220);
    public static readonly Color SUAVE = Color.FromArgb(168, 158, 142);
    public static readonly Color AMBAR = Color.FromArgb(224, 163, 59);
    public static readonly Color VERDE = Color.FromArgb(76, 195, 138);
    public static readonly Color VERMELHO = Color.FromArgb(239, 107, 107);
}

// Cabeçalho com degradê quente, o ícone, o nome e uma linha de brilho âmbar.
class Cabecalho : Control
{
    readonly Image icone;
    public Cabecalho(Image icone) { this.icone = icone; DoubleBuffered = true; }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        using (var f = new System.Drawing.Drawing2D.LinearGradientBrush(ClientRectangle, Color.FromArgb(48, 38, 24), Desenho.FUNDO, 20f)) g.FillRectangle(f, ClientRectangle);
        using (var halo = new System.Drawing.Drawing2D.GraphicsPath())
        {
            halo.AddEllipse(-10, -30, 170, 170);
            using (var b = new System.Drawing.Drawing2D.PathGradientBrush(halo) { CenterColor = Color.FromArgb(70, 224, 163, 59), SurroundColors = new[] { Color.FromArgb(0, 224, 163, 59) } })
                g.FillPath(b, halo);
        }
        if (icone != null) g.DrawImage(icone, 28, 28, 64, 64);
        using (var t = new Font("Segoe UI Semibold", 22f)) using (var b = new SolidBrush(Desenho.TEXTO)) g.DrawString("Spark", t, b, 104, 24);
        using (var s = new Font("Segoe UI", 10f)) using (var b = new SolidBrush(Desenho.SUAVE))
            g.DrawString("Vamos deixar o seu Claude pronto. Você só confirma e entra nas suas contas.", s, b, 107, 68);
        var faixa = new Rectangle(0, Height - 2, Width, 2);
        using (var linha = new System.Drawing.Drawing2D.LinearGradientBrush(faixa, Color.Transparent, Desenho.AMBAR, 0f))
        {
            linha.InterpolationColors = new System.Drawing.Drawing2D.ColorBlend
            {
                Colors = new[] { Color.FromArgb(0, 224, 163, 59), Color.FromArgb(200, 224, 163, 59), Color.FromArgb(0, 224, 163, 59) },
                Positions = new[] { 0f, 0.35f, 1f },
            };
            g.FillRectangle(linha, faixa);
        }
    }
}

// As etapas em cartões: número, carregando (arco girando), feito ou erro.
class Etapas : Control
{
    readonly string[] nomes;
    readonly int[] estado; // 0 a fazer, 1 rodando, 2 feito, 3 erro
    readonly System.Windows.Forms.Timer giro = new System.Windows.Forms.Timer { Interval = 40 };
    int angulo;
    public Etapas(string[] nomes)
    {
        this.nomes = nomes; estado = new int[nomes.Length]; DoubleBuffered = true;
        giro.Tick += delegate { angulo = (angulo + 12) % 360; Invalidate(); };
    }
    public void Definir(int i, int e)
    {
        estado[i] = e;
        bool algumRodando = false;
        foreach (var x in estado) if (x == 1) algumRodando = true;
        giro.Enabled = algumRodando;
        Invalidate();
    }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        g.Clear(Desenho.FUNDO);
        var meio = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
        using (var fonte = new Font("Segoe UI", 10.5f))
        using (var fonteN = new Font("Segoe UI Semibold", 9.5f))
        {
            for (int i = 0; i < nomes.Length; i++)
            {
                var r = new RectangleF(0.5f, i * 52 + 0.5f, Width - 1, 44);
                int st = estado[i];
                Color borda = st == 1 ? Color.FromArgb(150, Desenho.AMBAR) : st == 2 ? Color.FromArgb(90, Desenho.VERDE) : st == 3 ? Color.FromArgb(140, Desenho.VERMELHO) : Color.FromArgb(46, 43, 38);
                using (var caminho = Desenho.Arredondado(r, 10))
                using (var fundo = new SolidBrush(st == 2 ? Color.FromArgb(28, 38, 31) : Desenho.CARTAO))
                using (var lapis = new Pen(borda, 1f)) { g.FillPath(fundo, caminho); g.DrawPath(lapis, caminho); }
                var c = new RectangleF(14, r.Y + 10, 24, 24);
                if (st == 2)
                {
                    using (var b = new SolidBrush(Desenho.VERDE)) g.FillEllipse(b, c);
                    using (var p = new Pen(Color.White, 2.2f)) g.DrawLines(p, new[] { new PointF(c.X + 6.5f, c.Y + 12.5f), new PointF(c.X + 10.5f, c.Y + 16.5f), new PointF(c.X + 17.5f, c.Y + 8.5f) });
                }
                else if (st == 3)
                {
                    using (var b = new SolidBrush(Desenho.VERMELHO)) g.FillEllipse(b, c);
                    using (var p = new Pen(Color.White, 2.2f)) { g.DrawLine(p, c.X + 8, c.Y + 8, c.X + 16, c.Y + 16); g.DrawLine(p, c.X + 16, c.Y + 8, c.X + 8, c.Y + 16); }
                }
                else if (st == 1)
                {
                    using (var p = new Pen(Color.FromArgb(60, Desenho.AMBAR), 2.6f)) g.DrawEllipse(p, c);
                    using (var p = new Pen(Desenho.AMBAR, 2.6f)) g.DrawArc(p, c, angulo, 100);
                }
                else
                {
                    using (var p = new Pen(Color.FromArgb(80, Desenho.SUAVE), 1.4f)) g.DrawEllipse(p, c);
                    using (var b = new SolidBrush(Desenho.SUAVE)) g.DrawString((i + 1).ToString(), fonteN, b, c, meio);
                }
                using (var b = new SolidBrush(st == 0 ? Color.FromArgb(205, 198, 186) : st == 3 ? Desenho.VERMELHO : Desenho.TEXTO))
                    g.DrawString(nomes[i], fonte, b, 52, r.Y + 12);
            }
        }
    }
}

// Botão âmbar arredondado, que clareia com o mouse em cima e fica cinza desligado.
class Botao : Button
{
    bool sobre;
    public Botao()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer, true);
        FlatStyle = FlatStyle.Flat; FlatAppearance.BorderSize = 0; Font = new Font("Segoe UI Semibold", 10.5f); Cursor = Cursors.Hand;
    }
    protected override void OnMouseEnter(EventArgs e) { sobre = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { sobre = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnEnabledChanged(EventArgs e) { Invalidate(); base.OnEnabledChanged(e); }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        g.Clear(Parent != null ? Parent.BackColor : Desenho.FUNDO);
        var cor = !Enabled ? Color.FromArgb(70, 66, 60) : sobre ? Color.FromArgb(240, 184, 86) : Desenho.AMBAR;
        using (var caminho = Desenho.Arredondado(new RectangleF(0.5f, 0.5f, Width - 1, Height - 1), Height / 2f - 1))
        using (var b = new SolidBrush(cor)) g.FillPath(b, caminho);
        var meio = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
        using (var b = new SolidBrush(Enabled ? Color.FromArgb(26, 18, 6) : Desenho.SUAVE)) g.DrawString(Text, Font, b, new RectangleF(0, 0, Width, Height), meio);
    }
}

// Barra de progresso fina e arredondada (a do Windows fica branca no tema escuro).
class Barra : Control
{
    int valor, maximo = 1;
    public int Value { get { return valor; } set { valor = value; Invalidate(); } }
    public int Maximum { get { return maximo; } set { maximo = Math.Max(1, value); Invalidate(); } }
    public Barra() { DoubleBuffered = true; }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        g.Clear(Desenho.FUNDO);
        float raio = (Height - 1) / 2f;
        using (var trilho = Desenho.Arredondado(new RectangleF(0, 0, Width - 1, Height - 1), raio))
        using (var b = new SolidBrush(Desenho.CARTAO)) g.FillPath(b, trilho);
        float w = (float)(Width - 1) * Math.Min(valor, maximo) / maximo;
        if (w >= Height)
            using (var cheio = Desenho.Arredondado(new RectangleF(0, 0, w, Height - 1), raio))
            using (var b = new SolidBrush(Desenho.AMBAR)) g.FillPath(b, cheio);
    }
}
