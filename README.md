# Notion-line-Flashcard
> Turn line messenger to a flashcard application via Notion and line bot API.

I build this for increasing abillity to recall information that I don't want to forget (such as my lecture exam).
If you don't familiar with flashcard or don't know how this thing work, I recommed to read this article https://ncase.me/remember/.

## Example
<a href="https://imgur.com/mzgA4QB"><img src="https://i.imgur.com/mzgA4QB.gif" title="source: imgur.com" width="300"/></a>

## Feature
- Push flashcard with message command "open card"
- Create new card with notion database.
- Add frontside and backside of your card, and you can also add a picture on backside.
- Using Anki flashcard algorithm. (again, hard, good, easy)
- You can suspend card that you don't need anymore.
- "/pushcard" endpoint for auto sending daily flashcard. you can intregrate with this endpoint via making auto ping to this URL every time you want. (Recommend using with google app script)

## Flashcard database setting
Setting your flashcard with Notion database.
![image](https://user-images.githubusercontent.com/92264095/147410771-3bb874f1-2694-40d4-866a-25ecb7c43877.png)

