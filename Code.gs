function getRedditDataAndMatchBlog(redditPostURL, blogTopics) {
  // Append ".json" to the end of the post URL and make a GET request
  var post = UrlFetchApp.fetch(redditPostURL + '.json');
  
  // Parse the response
  var content = JSON.parse(post.getContentText());
  var postData = content[0].data.children[0].data;
  
  // Extract post title and text
  var postTitle = postData.title;
  var postText = postData.selftext;
  var subreddit = postData.subreddit;
  var upvotes = postData.ups;
  
  // Get blog content from your spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BlogContent");
  var blogContent = sheet.getRange(2, 1, sheet.getLastRow()-1, 3).getValues();
  
  // Find matching blog posts based on keywords
  var matches = [];
  for (var i = 0; i < blogContent.length; i++) {
    var blogTitle = blogContent[i][0];
    var blogCategory = blogContent[i][1];
    var blogKeywords = blogContent[i][2].toLowerCase().split(',');
    
    var matchFound = blogKeywords.some(keyword => 
      postTitle.toLowerCase().includes(keyword.trim()) || 
      postText.toLowerCase().includes(keyword.trim())
    );
    
    if (matchFound) {
      matches.push([postTitle, subreddit, upvotes, blogTitle, blogCategory]);
    }
  }
  
  // Write matches to a results sheet
  var resultsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RedditMatches");
  if (!resultsSheet) {
    resultsSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("RedditMatches");
    resultsSheet.appendRow(["Reddit Post", "Subreddit", "Upvotes", "Matching Blog", "Category"]);
  }
  
  // Add matches to the sheet
  for (var j = 0; j < matches.length; j++) {
    resultsSheet.appendRow(matches[j]);
  }
  
  return matches.length > 0 ? matches : "No matches found";
}

function searchSubredditForMatches(subreddit, limit) {
  // Set default limit if not specified
  limit = limit || 25;
  
  // Fetch recent posts from the subreddit
  var url = "https://www.reddit.com/r/" + subreddit + "/new.json?limit=" + limit;
  var response = UrlFetchApp.fetch(url, {
    headers: {
      "User-Agent": "GoogleSheets:RedditBlogMatcher:v1.0 (by /u/DanyellMarshall)"
    }
  });
  
  var data = JSON.parse(response.getContentText());
  var posts = data.data.children;
  
  // Get blog content from your spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BlogContent");
  var blogContent = sheet.getRange(2, 1, sheet.getLastRow()-1, 3).getValues();
  
  // Create or clear results sheet
  var resultsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RedditMatches");
  if (!resultsSheet) {
    resultsSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("RedditMatches");
    resultsSheet.appendRow(["Reddit Post", "Subreddit", "Upvotes", "Matching Blog", "Category", "Post URL"]);
  } else {
    resultsSheet.clear();
    resultsSheet.appendRow(["Reddit Post", "Subreddit", "Upvotes", "Matching Blog", "Category", "Post URL"]);
  }
  
  // Check each post for matches
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i].data;
    var postTitle = post.title;
    var postText = post.selftext;
    var upvotes = post.ups;
    var postUrl = "https://www.reddit.com" + post.permalink;
    
    // Find matching blog posts
    for (var j = 0; j < blogContent.length; j++) {
      var blogTitle = blogContent[j][0];
      var blogCategory = blogContent[j][1];
      var blogKeywords = blogContent[j][2].toLowerCase().split(',');
      
      var matchFound = blogKeywords.some(keyword => 
        postTitle.toLowerCase().includes(keyword.trim()) || 
        postText.toLowerCase().includes(keyword.trim())
      );
      
      if (matchFound) {
        resultsSheet.appendRow([postTitle, subreddit, upvotes, blogTitle, blogCategory, postUrl]);
      }
    }
  }
  
  return "Search completed. Check the RedditMatches sheet for results.";
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Reddit Blog Matcher')
      .addItem('Search Subreddit', 'showSearchDialog')
      .addToUi();
}

function showSearchDialog() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Search Subreddit',
    'Enter subreddit name (e.g., selfpublishing):',
    ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    var subreddit = response.getResponseText();
    searchSubredditForMatches(subreddit, 25);
    SpreadsheetApp.getActiveSpreadsheet().toast('Search completed!', 'Status');
  }
}
// Function to generate a comment using Gemini AI based on blog content
function generateCommentWithGemini(redditPostContent, blogPostContent) {
  // Your Gemini API key - store this in Script Properties for security
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  if (!API_KEY) {
    return "Error: Gemini API key not found. Please set it in Script Properties.";
  }
  
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  
  const prompt = `
    Read the following Reddit post and related blog content, then write a thoughtful, 
    relevant comment that would be appropriate to post on the Reddit thread.
    
    REDDIT POST:
    ${redditPostContent}
    
    MATCHING BLOG CONTENT:
    ${blogPostContent}
    
    Generate a comment that:
    1. Shows understanding of the Reddit post
    2. Adds value by referencing relevant information from the blog
    3. Is conversational and engaging
    4. Is between 3-5 sentences long
    5. Does not explicitly promote the blog but provides helpful information
  `;
  
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    }
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(`${url}?key=${API_KEY}`, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
      return responseData.candidates[0].content.parts[0].text;
    } else {
      return "Error generating comment: " + JSON.stringify(responseData);
    }
  } catch (error) {
    return "Error: " + error.toString();
  }
}

// Function to fetch blog content by title
function getBlogContentByTitle(blogTitle) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BlogContent");
  const blogData = sheet.getRange(2, 1, sheet.getLastRow()-1, 4).getValues(); // Assuming column 4 has blog content
  
  for (let i = 0; i < blogData.length; i++) {
    if (blogData[i][0] === blogTitle) {
      return blogData[i][3]; // Return blog content
    }
  }
  
  return "Blog content not found";
}

// Modified searchSubredditForMatches function to include comment generation
function searchSubredditForMatches(subreddit, limit) {
  // Set default limit if not specified
  limit = limit || 25;
  
  // Fetch recent posts from the subreddit
  var url = "https://www.reddit.com/r/" + subreddit + "/new.json?limit=" + limit;
  var response = UrlFetchApp.fetch(url, {
    headers: {
      "User-Agent": "GoogleSheets:RedditBlogMatcher:v1.0 (by /u/DanyellMarshall)"
    }
  });
  
  var data = JSON.parse(response.getContentText());
  var posts = data.data.children;
  
  // Get blog content from your spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BlogContent");
  var blogContent = sheet.getRange(2, 1, sheet.getLastRow()-1, 3).getValues();
  
  // Create or clear results sheet
  var resultsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RedditMatches");
  if (!resultsSheet) {
    resultsSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("RedditMatches");
    resultsSheet.appendRow(["Reddit Post", "Subreddit", "Upvotes", "Matching Blog", "Category", "Post URL", "Generated Comment"]);
  } else {
    resultsSheet.clear();
    resultsSheet.appendRow(["Reddit Post", "Subreddit", "Upvotes", "Matching Blog", "Category", "Post URL", "Generated Comment"]);
  }
  
  // Check each post for matches
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i].data;
    var postTitle = post.title;
    var postText = post.selftext;
    var upvotes = post.ups;
    var postUrl = "https://www.reddit.com" + post.permalink;
    
    // Find matching blog posts
    for (var j = 0; j < blogContent.length; j++) {
      var blogTitle = blogContent[j][0];
      var blogCategory = blogContent[j][1];
      var blogKeywords = blogContent[j][2].toLowerCase().split(',');
      
      var matchFound = blogKeywords.some(keyword => 
        postTitle.toLowerCase().includes(keyword.trim()) || 
        postText.toLowerCase().includes(keyword.trim())
      );
      
      if (matchFound) {
        // Get full blog content
        var fullBlogContent = getBlogContentByTitle(blogTitle);
        
        // Generate comment using Gemini
        var redditContent = `Title: ${postTitle}\n\nContent: ${postText}`;
        var generatedComment = generateCommentWithGemini(redditContent, fullBlogContent);
        
        resultsSheet.appendRow([postTitle, subreddit, upvotes, blogTitle, blogCategory, postUrl, generatedComment]);
      }
    }
  }
  
  return "Search completed. Check the RedditMatches sheet for results and generated comments.";
}

// Add a menu item to post comments
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Reddit Blog Matcher')
      .addItem('Search Subreddit', 'showSearchDialog')
      .addItem('Set Gemini API Key', 'setGeminiApiKey')
      .addToUi();
}

// Function to set the Gemini API key
function setGeminiApiKey() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Set Gemini API Key',
    'Enter your Gemini API key:',
    ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    var apiKey = response.getResponseText();
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
    ui.alert('API key saved successfully!');
  }
}
