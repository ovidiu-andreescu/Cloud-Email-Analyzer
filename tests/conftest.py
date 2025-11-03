import os, pytest

os.environ["AWS_DEFAULT_REGION"] = "eu-central-1"
os.environ["LEDGER_TABLE"] = "test-ledger-table"
os.environ["AWS_ACCESS_KEY_ID"] = "test"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test"

def pytest_addoption(parser):
    parser.addoption("--runslow", action="store_true", help="run slow tests")

def pytest_configure(config):
    config.addinivalue_line("markers", "slow: mark test as slow")

def pytest_collection_modifyitems(config, items):
    if not config.getoption("--runslow"):
        skip_slow = pytest.mark.skip(reason="need --runslow to run")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)

@pytest.fixture(autouse=True)
def _test_env(monkeypatch):
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("LOG_LEVEL", "WARNING")
