# # web_server/app/database.py
# from sqlmodel import SQLModel, create_engine, Session
#
# DATABASE_URL = "sqlite:///./app.db"
# engine = create_engine(DATABASE_URL, echo=False)
#
# def init_db():
#     from . import models  # ensure models are imported
#     SQLModel.metadata.create_all(engine)
#
# def get_session():
#     # FastAPI will treat this as a dependency generator
#     with Session(engine) as session:
#         yield session
