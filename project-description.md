# Inspiration

WhatsApp group chats are great. But often, they tend to become a huge and confusing mess. We wanted to use AI to shed some light on our communication: Who is most active? Which group member sends the most happy messages, which is most negative? Who likes to start conversations, and who is only replying?

# What it does

Our Android app sends the chat log to the Azure cloud for analysis, where we use Microsoft's AI services to analyze several aspects of the chat: The absolute and relative share of messages for each group member, their level of activity at certain times and days and the 'positivity' of their messages.
All of this information is then displayed in beautiful graphs back in our Android app.


# How we built it
Our Android app disguises as an email app to get the chat logs via the "send chat via email" feature of WhatsApp. The log's text file is then sent to an Azure instance, where we use node.js to take apart the messages and analyse them under a number of aspects.
First, we calculate the absolute and relative number of messages and conversations started by each group member and analyze the days and times when each user is most active. Then, we use Azure to analyze the tone of certain groups of messages and thereby calculate sentiment scores for each member and conversation. These are then averaged to get a single 'positivity score' for each group member and the group as a whole.
All of this data is then visualized beautifully and shown on a web view inside our app...

# Challenges we ran into

tba

# Accomplishments that we're proud of

tba

# What we learned

tba

# What's next for Chat Analyzer

tba

# Built With

tba 


