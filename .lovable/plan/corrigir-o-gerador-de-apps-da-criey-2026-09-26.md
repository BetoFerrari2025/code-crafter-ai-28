# Corrigir o gerador de apps da Criey

## Objetivo
Fazer o chat gerar e editar apps que abrem no preview, interrompendo o ciclo atual de código inválido e auto-correções repetidas.

## Implementação
1. **Preservar o projeto existente em toda edição**
   - Enviar sempre o código atual em um campo próprio quando já houver um app no editor.
   - Remover a regra frágil que só reconhece algumas palavras como “corrija” ou “mude”.
   - Garantir que a auto-correção trabalhe sobre a versão que realmente falhou.

2. **Corrigir imports antes da compilação**
   - Normalizar imports de React e Lucide mesmo quando vierem quebrados em várias linhas.
   - Extrair e deduplicar os ícones, remover todos os imports do código executado e injetar uma única declaração válida.
   - Remover declarações `LucideIcons` já devolvidas pela IA, inclusive multilinhas.

3. **Melhorar geração e validação**
   - Atualizar a chamada de geração para o modelo padrão mais capaz da plataforma, usando o protocolo correto de streaming e histórico completo.
   - Reforçar as regras do ambiente do preview sem instruções contraditórias.
   - Validar o código recebido antes de mostrá-lo; erros devem retornar uma mensagem útil, não um app quebrado.

4. **Evitar loops e desperdício de créditos**
   - Identificar cada erro e cada versão de código para não reenviar a mesma correção.
   - Manter a última versão funcional disponível quando uma nova edição falhar.

## Validação
- Reproduzir o caso da imagem com import Lucide multilinha e confirmar que compila sem declaração duplicada.
- Criar um app simples e depois pedir uma alteração, confirmando que o mesmo projeto é editado.
- Forçar um erro e confirmar que a auto-correção não repete indefinidamente a mesma tentativa.
- Conferir o preview em desktop e celular e verificar os registros de execução.

## Detalhes técnicos
- O saneamento será centralizado e usado antes de cada compilação.
- O código atual viajará separado da conversa, evitando duplicação no texto do pedido.
- A geração continuará em streaming e manterá imagens anexadas no formato multimodal suportado.
