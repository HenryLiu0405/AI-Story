from sqlalchemy import create_engine, text
engine = create_engine('sqlite:///./novel_companion.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM projects'))
    count = result.scalar()
    print(f'Projects count: {count}')

# Migration: add locked and confidence columns to story_bible_entries
try:
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE story_bible_entries ADD COLUMN locked BOOLEAN DEFAULT 0'))
        conn.execute(text('ALTER TABLE story_bible_entries ADD COLUMN confidence FLOAT DEFAULT 1.0'))
        conn.commit()
        print('Migration: added locked and confidence columns to story_bible_entries')
except Exception as e:
    print(f'Migration note: {e}')
