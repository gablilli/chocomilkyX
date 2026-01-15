<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=170&text=chocomilky%20revived&fontSize=38&fontColor=fff7ed&color=0:4e342e,50:6d4c41,100:d7ccc8&animation=fadeIn" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/gablilli/chocomilky-revived?style=for-the-badge" />
  <img src="https://img.shields.io/github/forks/gablilli/chocomilky-revived?style=for-the-badge" />
  <img src="https://img.shields.io/github/issues-pr/gablilli/chocomilky-revived?style=for-the-badge" />
</p>

# 🍫 chocomilky-revived

**chocomilky-revived** is a simple static web project for downloading ipas from your favourite repos.
the project is designed to be lightweight, easy to customize, and ready for github pages.
your favourite library, with the repos you need, all in one place.

🔗 **live**  
https://gablilli.github.io/chocomilky-revived/

---

## ✨ features

- static html webpage  
- ready for github pages  
- minimal and lightweight  
- easy to extend and customize  

---

## i want my repos!

want to add your favorite repo to chocomilky?

1. fork this repository
2. add your repo as a string (see example below)
3. commit your changes
4. open a pull request

### example

add an entry like this to the repos json file:

```json
{
  "url": "https://example.com/repo.json"
}
```

that’s it 🍫

### i don't want to open a pr

private repo submission is coming soon,  
so stay connected 👀

## i want to selfhost it - 🚀 getting started

### clone the repository

```bash
git clone https://github.com/gablilli/chocomilky-revived.git
cd chocomilky-revived
````

### run locally

open `index.html` directly in your browser
or use a local server (recommended):

```bash
npx http-server .
```

---

## 📁 project structure

```
chocomilky-revived/
├── .github/        # github workflows to deploy on pages
├── index.html     # main page
├── back/        # here is stored the json with the repos
├── readme.md
└── license
```

---

## 📄 license

this project is licensed under the **mit license**.
see the `license` file for details.

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:4e342e,50:6d4c41,100:d7ccc8&height=120&section=footer" />
</p>
