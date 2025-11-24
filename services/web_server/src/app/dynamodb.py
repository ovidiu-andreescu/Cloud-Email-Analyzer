from services_common.aws_helper import get_table

USER_TABLE_NAME = 'User'
EMAIL_TABLE_NAME = 'Email'

def get_user_table():
    return get_table(USER_TABLE_NAME)

def get_email_table():
    return get_table(EMAIL_TABLE_NAME)

def create_user(user_id: str, email: str, is_active: bool = True):
    table = get_user_table()
    table.put_item(
        Item={
            'id': user_id,
            'email': email,
            'is_active': is_active
        }
    )

def get_email(email_id: int):
    table = get_email_table()
    response = table.get_item(
        Key={
            'email_id': email_id
        }
    )
    return response.get('Item')

def get_user(user_id: str):
    table = get_user_table()
    response = table.get_item(
        Key={
            'id': user_id
        }
    )
    return response.get('Item')