from sqlalchemy import create_engine, text
engine = create_engine('sqlite:///./novel_companion.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM projects'))
    count = result.scalar()
    print(f'Projects count: {count}')
