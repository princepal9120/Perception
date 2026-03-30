import os
import logging
from datetime import datetime
import structlog


class CustomLogger:
    def __init__(self, log_dir="logs"):
        self.logs_dir = os.path.join(os.getcwd(), log_dir)
        self.log_file_path = None
        try:
            os.makedirs(self.logs_dir, exist_ok=True)
            log_file = f"{datetime.now().strftime('%m_%d_%Y_%H_%M_%S')}.log"
            self.log_file_path = os.path.join(self.logs_dir, log_file)
        except PermissionError:
            # In containerized environments, the logs dir may not be writable
            pass

    def get_logger(self, name=__file__):
        logger_name = os.path.basename(name)

        handlers = []

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(logging.Formatter("%(message)s"))
        handlers.append(console_handler)

        if self.log_file_path:
            file_handler = logging.FileHandler(self.log_file_path)
            file_handler.setLevel(logging.INFO)
            file_handler.setFormatter(logging.Formatter("%(message)s"))
            handlers.append(file_handler)

        logging.basicConfig(
            level=logging.INFO,
            format="%(message)s",
            handlers=handlers,
        )

        structlog.configure(
            processors=[
                structlog.processors.TimeStamper(fmt="iso", utc=True, key="timestamp"),
                structlog.processors.add_log_level,
                structlog.processors.EventRenamer(to="event"),
                structlog.processors.JSONRenderer()
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

        return structlog.get_logger(logger_name)