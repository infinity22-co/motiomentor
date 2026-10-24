<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- AI tutor chat streams from the server route `src/routes/api/chat.ts` (verifies the bearer token itself) using the Lovable AI Gateway Responses API; keys never reach the browser.
- Chat history is one conversation per student, stored as AI SDK UIMessage JSON in `chat_messages`; learning method and exam result live on `profiles`.
- Learning-style exam scoring lives in `src/lib/learning.ts` with tests in `src/test/learning.test.ts`, so scoring rules stay testable.
- Diagrams are AI-written SVG code blocks rendered as images (data URI), so no script in them can run.
