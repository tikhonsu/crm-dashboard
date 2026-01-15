# CRM Dashboard (Vite + React + Tailwind)

## Локальный запуск
```bash
npm i
npm run dev
```

## Публикация на GitHub Pages (самый простой вариант)
1) Создайте репозиторий на GitHub
2) В `vite.config.js` установите `base: '/REPO_NAME/'`
3) В `package.json` укажите корректный `homepage` не требуется, используется base
4) Выполните:
```bash
npm run deploy
```
5) В GitHub → Settings → Pages убедитесь что Pages включён (обычно ветка `gh-pages`).

Если хотите деплой через GitHub Actions — скажите, добавлю workflow.
