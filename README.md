# Jito's Software Development Intern "html2json" Test Task

SOLUTION ON BOTTOM

## Task Rationale
This task is designed to evaluate how well you solve problems without having every detail explicitly provided and to assess the quality of your deliverables. This type of task isn't necessarily reflective of your future work but aims to help us understand your thought process and reasoning in the context of software development.

## Assignment
Your task is to implement a function called `html2json`, which converts HTML data into a JSON representation.
AI tools usage is <b>REQUIRED</b>. Is is required that you provide your entire conversation history by attaching a link to the dialogue. Therefore, keep all your research within a single conversation and submit the link along with your task.

## Expected repository structure
- `html2json.js` - This file should contain your implementation of the html2json function.
- `html_samples/` folder - Include files with a text that you used as samples to test your function.
- `index.html` - The initial file we provided. You can leave it unchanged, but please include it in the archive.
- `ai_help/` folder - If you used any resources for code generation:
- Create a file named `chatgpt_chat.txt` with a link to the ChatGPT chat used.
- For any other AI resources, attach relevant `.pdf`, `.png`, or `.mp4` files showing how you used them.
- You can optionally update `README.md` completely if you want to add explanations of your reasoning or any other comments.

## Key Points for Evaluation
- Coverage of various HTML structures and different sizes.
- The code <b>MUST NOT</b> crash.
- Code cleanliness and formatting.
- Using a DOM parser is not allowed.
- How effectively you handled unexpected scenarios, such as situations where your code received valid HTML but still crashed or produced incorrect results. We will evaluate your ability to anticipate edge cases and ensure robustness in your solution.

## P.S. from the team
Please focus on quality rather than speed. Quality in this context means ensuring your solution is well thought-out, robust, and free of obvious issues. The speed of delivery will <b>NOT</b> be prioritized, so take the necessary time to research and refine your approach, as long as you complete the task within the specified timeframe.
Before submitting your final results, double or even triple-check everything:
- Verify that all links you provide are accessible in incognito mode, as broken links will result in your submission <b>NOT</b> being reviewed.
- Just before submitting, test your code again to ensure it still functions correctly and handles the html samples without crashing. If your code crashes or fails on your own samples, it will be treated as a failed submission.
- Make sure all items are included according to the [Expected Deliverables](#expected-deliverables) section. If any required files or information are missing, we will <b>NOT</b> be able to review your task, and it will be <ins>treated as failed</ins>.
- Jito’s senior developer will thoroughly review your solution. Based on this review, if deemed appropriate, you may be invited for a technical code review. This will include questions about the code, your understanding, and the reasoning behind your solution choices.
- The best indicator that you’ve done your best is the feeling of confidence when submitting, knowing that you have thoroughly checked your work and cannot think of anything more to improve.
- You can view test task template [here](https://jito-dev.github.io/jito-intern-test-task/)

## Solution

`html2json` function in [html2json.js](./html2json.js) must be tested on real examples. So I decided to get index.html file of common popular websites and write them to [html_samples](./html_samples/) folder:
- [ebay](https://www.ebay.com/itm/166708867898?_trkparms=amclksrc%3DITM%26aid%3D777008%26algo%3DPERSONAL.TOPIC%26ao%3D1%26asc%3D20250506202230%26meid%3D29654a361b98433d8d9660bf5238a013%26pid%3D102751%26rk%3D1%26rkt%3D1%26mehot%3Dpp%26itm%3D166708867898%26pmt%3D1%26noa%3D1%26pg%3D4375194%26algv%3DRecentlyViewedItemsV2SignedOut%26brand%3DBose%26tu%3D01M397MRZTH6ETDFGAJMNQY9XJ) ([file](./html_samples/ebay/index.html))
- [wikipedia](https://uk.wikipedia.org/wiki/%D0%9D%D0%B5%D0%BF%D1%82%D1%83%D0%BD_(%D0%BF%D0%BB%D0%B0%D0%BD%D0%B5%D1%82%D0%B0)) ([file](./html_samples/wikipedia/index.html))
- [comfy](https://comfy.ua/ua/noutbuk-igrovij-lenovo-legion-5-15irx10-83ly00t7ra-eclipse-black.html?gad_source=1&gad_campaignid=19171478135&gbraid=0AAAAAC-ixwiaIRTzcXHX1hdub1vEaV3B1&gclid=Cj0KCQjwlNPVBhCMARIsAPZ5RqhPPPpgJCAifGRc-H_pl5it-6Q-1q-qRoKTin4B83a1XjT4QiEfwpYaAo8YEALw_wcB) ([file](./html_samples/comfy/index.html))
- [iquilezles.org](https://iquilezles.org/) ([file](./html_samples/iquilezles/index.html))
- [shadertoy](https://www.shadertoy.com/) ([file](./html_samples/shadertoy/index.html))

Then I made analyse with AI and by myself of these websites structure. I found such patterns:
- 
-
-
-

After patterns definition I understand that I can use such format for my JSON results:
- 
- 
- 

Why this will be enough? Because .

