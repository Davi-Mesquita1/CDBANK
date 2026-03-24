  /* ════════════════════════════════════════════════════════════
       GERAÇÃO DAS LINHAS ONDULADAS NO PAINEL DIREITO
       Cada linha é um <path> SVG criado via JavaScript,
       com amplitude e frequência variáveis para parecerem
       orgânicas (inspirado no design original do CDBANK).
    ════════════════════════════════════════════════════════════ */
    const svg       = document.querySelector('.waves-svg');
    const ns        = 'http://www.w3.org/2000/svg'; // namespace obrigatório para criar elementos SVG via JS
    const W         = 400;   // largura do viewBox do SVG
    const H         = 800;   // altura do viewBox do SVG
    const numLines  = 38;    // quantidade de linhas horizontais
    const lineSpacing = H / (numLines - 1); // espaçamento uniforme entre as linhas

    for (let i = 0; i < numLines; i++) {

      const path = document.createElementNS(ns, 'path'); // cria um elemento <path> no namespace SVG

      const y = i * lineSpacing; // posição Y base de cada linha (sem ondulação)

      /* Amplitude: varia entre ~8px e ~28px dependendo do índice.
         Math.sin(i * 0.4) cria variação suave entre as linhas. */
      const amplitude = 18 + Math.sin(i * 0.4) * 10;

      /* Frequência: controla quantas ondas cabem na linha.
         Pequenas variações deixam as ondas menos mecânicas. */
      const freq = 0.018 + Math.sin(i * 0.15) * 0.006;

      /* Phase: desloca o ponto inicial da onda para cada linha,
         evitando que todas comecem no mesmo ponto. */
      const phase = i * 0.7;

      /* Constrói o atributo "d" do path, ponto a ponto.
         Começa em x=0 e avança de 4 em 4 pixels até o fim. */
      let d = `M 0 ${y}`; // "M" = Move To (ponto inicial)

      for (let x = 0; x <= W; x += 4) {
        /* dy: deslocamento vertical da onda neste ponto x.
           Combina dois senos para criar variação orgânica
           tanto horizontal quanto entre as linhas. */
        const dy = Math.sin(x * freq + phase) * amplitude * Math.sin(i * 0.2 + 0.5);
        d += ` L ${x} ${y + dy}`; // "L" = Line To (traça linha até este ponto)
      }

      /* Aplica os atributos visuais ao path */
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');               // linha sem preenchimento
      path.setAttribute('stroke', '#c8c8c8');          // cor cinza claro
      path.setAttribute('stroke-width', '1.1');        // espessura fina
      path.setAttribute('opacity', '0.85');            // leve transparência

      svg.appendChild(path); // adiciona a linha ao SVG
    }