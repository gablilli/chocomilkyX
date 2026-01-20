# contributing to chocomilkyx

hey! thanks for wanting to contribute 🍫  
whether you want to add new repos or help improve the project, this guide will help you get started.

---

## adding a new repo

to add a repo to chocomilkyx:

1. fork this repository  
2. open the `back/global-repos.json` file  
3. add a new entry like this:

```json
{
  "url": "https://example.com/repo.json"
}
````

4. commit your changes
5. open a pull request

tips:

* make sure your url points to a valid json file with the right structure
* only submit repos you have the right to share
* keep your pr descriptive so it's easy to review

---

## commit messages

we like to keep commit messages simple and clear. a small convention we follow:

* **feat:** a new feature or adding a repo
* **fix:** fixing a bug or typo
* **chore:** maintenance, formatting, small tweaks
* **docs:** updating documentation
* **refactor:** cleaning up code without adding features

examples:

```
feat: add example repo to repos.json
fix: correct url for existing repo
chore: update badges
```

---

## code style & guidelines

* keep json entries valid and formatted
* respect the lightweight, minimal spirit of the project
* don't break the static site or github pages deployment

---

## review process

* your pull request will be checked by the maintainers
* once approved, it will be merged into main
* be ready to respond to feedback or tweak things if needed

---

thanks again for helping make chocomilkyx better! 🚀
