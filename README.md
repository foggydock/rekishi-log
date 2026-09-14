# 歴史ログ（旧URL用ブランチ）

このブランチは、旧URL https://foggydock.github.io/rekishi-log/ を GitHub Pages で配信するためだけのものです。
アプリ本体は `main` ブランチにあり、https://rekishi-log.pages.dev/ （Cloudflare Pages）で公開しています。

- `index.html` / `404.html`：新しいURLへ移動するページ。移動する前に、この端末に残っているログイン状態や API キーを消し、前の版のオフライン機能を止めます。
- 端末の中にしか無いデータが残っている場合は、自動では移動せず、コピーしてから新しいURLを開けるようにしています。
