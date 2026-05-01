FROM public.ecr.aws/lambda/python:3.11
WORKDIR /var/task

COPY libs/common/pyproject.toml /tmp/common/pyproject.toml
COPY libs/common/src /tmp/common/src
RUN pip install --no-cache-dir /tmp/common && rm -rf /tmp/common

COPY services/resolve_recipients/pyproject.toml ./pyproject.toml
COPY services/resolve_recipients/src ./src
RUN pip install --no-cache-dir .

CMD [ "resolve_recipients.main.handler" ]
