"""
ReviewResponder - Automatischer Content Generator
==================================================
Dieses Script generiert automatisch SEO-optimierte Blog-Posts
und Social Media Content der Traffic zu deiner App bringt.

EINMALIGE INSTALLATION:
    pip install openai schedule

VERWENDUNG:
    python auto_content_generator.py

Das Script erstellt automatisch Content und speichert ihn in /content/
Du kannst den Content dann auf Medium, LinkedIn, Twitter posten.
"""

import os
import json
from datetime import datetime
import random

# Versuche OpenAI zu importieren
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Content Themen die Traffic bringen
BLOG_TOPICS = [
    "How to Respond to Negative Reviews: A Complete Guide for Small Businesses",
    "5 Review Response Templates That Will Save Your Restaurant's Reputation",
    "Why Responding to Google Reviews Boosts Your SEO (With Data)",
    "The Psychology Behind Customer Reviews: What Business Owners Need to Know",
    "Hotel Review Response Best Practices: Turn Critics into Fans",
    "Negative Yelp Review? Here's Exactly What to Say",
    "How AI is Revolutionizing Review Management for Small Businesses",
    "The Cost of Ignoring Customer Reviews (And How to Fix It)",
    "Review Response Time: Why Speed Matters for Your Business",
    "Turning 1-Star Reviews into 5-Star Customer Experiences",
    "The Ultimate Guide to Google My Business Review Management",
    "Why Your Competitors Are Winning the Review Game (And You're Not)",
    "Cafe Owner's Guide to Handling Food Criticism Online",
    "Dental Practice Review Management: HIPAA-Compliant Responses",
    "How to Ask for Reviews Without Being Pushy",
]

SOCIAL_MEDIA_HOOKS = [
    "93% of customers read reviews before buying. Are you responding to yours?",
    "That 1-star review you're ignoring? It's costing you $30,000/year.",
    "Businesses that respond to reviews see 12% higher revenue. Here's why...",
    "Your competitor just responded to their negative review in 2 hours. You haven't in 2 weeks.",
    "Plot twist: Negative reviews can actually BOOST your sales. Here's how.",
    "The perfect review response takes 45 minutes. Or 45 seconds with AI.",
    "Stop copy-pasting the same 'We're sorry' response. Customers notice.",
    "Fun fact: 45% of consumers are more likely to visit a business that responds to negative reviews.",
    "Your negative reviews aren't the problem. Your silence is.",
    "Every unanswered review is a customer you'll never get back.",
]

def setup_directories():
    """Erstelle notwendige Ordner"""
    dirs = ['content', 'content/blog', 'content/social', 'content/email']
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print("Ordner erstellt/verifiziert.")

def load_api_key():
    """Lade OpenAI API Key"""
    # Versuche aus .env zu laden
    env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('OPENAI_API_KEY='):
                    return line.split('=', 1)[1].strip()

    # Frage nach Key
    print("\nOpenAI API Key nicht gefunden.")
    print("Du findest deinen Key auf: https://platform.openai.com/api-keys")
    key = input("OpenAI API Key eingeben: ").strip()
    return key

def generate_blog_post(client, topic):
    """Generiere einen SEO-optimierten Blog Post"""
    prompt = f"""Write a comprehensive, SEO-optimized blog post about:
"{topic}"

Requirements:
- 800-1000 words
- Include an engaging introduction
- Use H2 and H3 subheadings (use ## and ### markdown)
- Include practical, actionable tips
- Add a compelling call-to-action at the end mentioning ReviewResponder (an AI tool that generates professional review responses in seconds)
- Use keywords naturally: review response, customer reviews, reputation management, small business
- Make it helpful and not too salesy
- Include statistics or data points where relevant

Write in a professional but friendly tone. The target audience is small business owners (restaurants, hotels, cafes, dental practices, etc.)."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )

    return response.choices[0].message.content

def generate_social_posts(client, hook):
    """Generiere Social Media Posts basierend auf einem Hook"""
    prompt = f"""Create 3 variations of social media posts based on this hook:
"{hook}"

Create:
1. A Twitter/X post (max 280 characters, punchy, with relevant hashtags)
2. A LinkedIn post (2-3 paragraphs, professional, storytelling approach)
3. A Reddit-style comment (helpful, not promotional, would fit in r/smallbusiness)

Each post should subtly mention that AI tools can help with review responses, but don't be too salesy.
Format as JSON with keys: twitter, linkedin, reddit"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )

    return response.choices[0].message.content

def generate_email_sequence(client):
    """Generiere eine E-Mail Follow-up Sequenz"""
    prompt = """Create a 3-email follow-up sequence for cold outreach to small business owners about ReviewResponder (AI review response tool).

Email 1: Initial contact (subject line + body)
- Focus on pain point (time spent on reviews, negative reviews hurting business)
- Offer free trial
- Keep short (under 100 words)

Email 2: Follow-up after 3 days (subject line + body)
- Reference first email
- Share a quick stat or benefit
- Slightly different angle

Email 3: Final follow-up after 7 days (subject line + body)
- Create urgency
- Final offer
- Easy opt-out

Make emails feel personal, not template-y. Use [BUSINESS_NAME] and [OWNER_NAME] as placeholders.
Format as JSON with structure: {email1: {subject, body}, email2: {subject, body}, email3: {subject, body}}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500
    )

    return response.choices[0].message.content

def save_content(content, content_type, filename):
    """Speichere generierten Content"""
    filepath = os.path.join('content', content_type, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Gespeichert: {filepath}")
    return filepath

def generate_all_content():
    """Generiere allen Content auf einmal"""
    if not OPENAI_AVAILABLE:
        print("\nFEHLER: OpenAI Paket nicht installiert!")
        print("Installiere mit: pip install openai")
        return

    api_key = load_api_key()
    if not api_key:
        print("Kein API Key angegeben. Abbruch.")
        return

    client = OpenAI(api_key=api_key)
    setup_directories()

    print("\n" + "="*50)
    print("CONTENT GENERATION GESTARTET")
    print("="*50)

    # Generiere Blog Posts
    print("\n1. Generiere Blog Posts...")
    selected_topics = random.sample(BLOG_TOPICS, 3)  # 3 zufällige Topics

    for i, topic in enumerate(selected_topics, 1):
        print(f"   Blog {i}/3: {topic[:50]}...")
        try:
            content = generate_blog_post(client, topic)
            filename = f"blog_{datetime.now().strftime('%Y%m%d')}_{i}.md"
            save_content(content, 'blog', filename)
        except Exception as e:
            print(f"   Fehler: {e}")

    # Generiere Social Media Posts
    print("\n2. Generiere Social Media Posts...")
    selected_hooks = random.sample(SOCIAL_MEDIA_HOOKS, 3)

    for i, hook in enumerate(selected_hooks, 1):
        print(f"   Social {i}/3: {hook[:40]}...")
        try:
            content = generate_social_posts(client, hook)
            filename = f"social_{datetime.now().strftime('%Y%m%d')}_{i}.json"
            save_content(content, 'social', filename)
        except Exception as e:
            print(f"   Fehler: {e}")

    # Generiere Email Sequenz
    print("\n3. Generiere Email Follow-up Sequenz...")
    try:
        content = generate_email_sequence(client)
        filename = f"email_sequence_{datetime.now().strftime('%Y%m%d')}.json"
        save_content(content, 'email', filename)
    except Exception as e:
        print(f"   Fehler: {e}")

    print("\n" + "="*50)
    print("FERTIG!")
    print("="*50)
    print(f"""
Dein Content wurde generiert und gespeichert in:
- content/blog/     - Blog Posts (poste auf Medium, Dev.to, eigener Blog)
- content/social/   - Social Media Posts (Twitter, LinkedIn, Reddit)
- content/email/    - Email Templates (für Outreach)

NÄCHSTE SCHRITTE (einmalig pro Woche, ~10 Minuten):
1. Öffne content/blog/ und kopiere einen Post auf Medium.com
2. Öffne content/social/ und poste auf LinkedIn/Twitter
3. Nutze content/email/ für Kaltakquise

Führe dieses Script wöchentlich aus für frischen Content!
""")

def main():
    print("""
    ╔═══════════════════════════════════════════════════╗
    ║     REVIEWRESPONDER AUTO CONTENT GENERATOR        ║
    ║     Generiere Marketing Content mit AI           ║
    ╚═══════════════════════════════════════════════════╝
    """)

    print("Dieses Tool generiert automatisch:")
    print("  - SEO-optimierte Blog Posts")
    print("  - Social Media Posts (Twitter, LinkedIn, Reddit)")
    print("  - Email Outreach Sequenzen")
    print("")
    print("Der Content wird in ./content/ gespeichert.")
    print("")

    input("Drücke Enter um zu starten...")
    generate_all_content()

if __name__ == "__main__":
    main()
