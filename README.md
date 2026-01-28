<p align="center">
  <img src="https://img.shields.io/github/stars/gablilli/chocomilkyX?style=for-the-badge" alt="GitHub stars" />
  <img src="https://img.shields.io/github/forks/gablilli/chocomilkyX?style=for-the-badge" alt="GitHub forks" />
  <img src="https://img.shields.io/github/issues-pr/gablilli/chocomilkyX?style=for-the-badge" alt="Open PRs" />
</p>

<p align="center">
  <img src="static/icons/logo1024x1024.png" alt="Choco MilkyX Logo" width="200"/>
</p>

<h1 align="center">chocomilkyX Library</h1>


<p align="center">
  The chocomilkyX library is a simple static web project for downloading IPAs from your favourite repos.<br/>
  The project is designed to be lightweight, easy to customize, and ready for a static deploy.<br/>
  Your favourite library, with the repos you need, all in one place.
</p>

<p align="center">
  🔗 <strong>Live:</strong> <a href="https://chocomilkyX.vercel.app">https://chocomilkyX.vercel.app</a>
</p>


---

> [!note]
> 28 jan '26 - migrated the site's address to vercel, for better recheability.
> nothing has changed in the code.

## ✨ features

- static html webpage  
- ready for github pages or vercel 
- minimal and lightweight  
- personal repos import

## contribute to the project

want to add repos to the library?
first of all, thank you!
to proceed:

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

for other contributions, see the contributing file.  

## selfhost it - 🚀 getting started

### clone the repository

```bash
git clone https://github.com/gablilli/chocomilkyX.git
cd chocomilkyX
````

### run locally

open `index.html` directly in your browser
or use a local server (recommended):

```bash
npx http-server .
```

---
## about chocomilkyv2
ChocoMilkyV2 was the original version of this project, created by chocomilky.  
chocomilkyX continues and updates it with new features, improvements, and bug fixes, while making the library free and opensource.
This project is a **revived version**, maintaining compatibility with the original repos and adding enhancements.

> [!WARNING]  
> chocomilkyX **does not host any IPA files**.  
>All downloadable files are provided by the original repositories.  
>This project simply accesses to them.
>Users are responsible for complying with the terms and conditions of the original sources.

## 📄 license

this project is licensed under the **gpl v3 license**.
see the `license` file for details.


