import time
import smtplib
import queue
import logging
from email.mime.text import MIMEText
from prometheus_client import Histogram

logger = logging.getLogger(__name__)
EMAIL_SEND_DURATION = Histogram(
    "email_send_duration_seconds", "Time spent sending an email"
)


class SMTPConnectionError(Exception):
    pass


class SMTPConfig:
    def __init__(self, host, port, user, password):
        self.host = host
        self.port = port
        self.user = user
        self.password = password


class SMTPConnection:
    def __init__(self, config: SMTPConfig):
        self.config = config
        self.connection = None
        self.connect()

    def validate(self):
        if self.connection is None:
            raise SMTPConnectionError("No SMTP connection established")
        try:
            self.connection.noop()
        except Exception:
            raise SMTPConnectionError("SMTP connection is not valid")

    def connect(self):
        try:
            self.validate()
        except SMTPConnectionError:
            if self.connection:
                self.close()
            self.connection = smtplib.SMTP_SSL(self.config.host, self.config.port)
            self.connection.login(self.config.user, self.config.password)
        except Exception as e:
            logger.info("Failed to connect to SMTP server")
            raise SMTPConnectionError("Failed to connect to SMTP server")

    def send(self, to_addr, subject, msg):
        msg = MIMEText(msg)
        msg["Subject"] = subject
        msg["From"] = self.config.user
        msg["To"] = to_addr
        start_time = time.time()
        try:
            self.connection.sendmail(self.config.user, to_addr, msg.as_string())
        except Exception as e:
            raise SMTPConnectionError("Failed to send email") from e
        finally:
            duration = time.time() - start_time
            EMAIL_SEND_DURATION.observe(duration)

    def quit(self):
        if self.connection:
            try:
                self.connection.quit()
            except Exception:
                pass
            self.connection = None


class SMTPConnectionPool:
    def __init__(self, config: SMTPConfig, pool_size=5):
        self.config = SMTPConfig
        self.pool_size = pool_size
        self.config = config

        self._pool = queue.Queue(maxsize=pool_size)
        self._initialize_pool()

    def _create_connection(self):
        logger.info("create new SMTP connection")
        connection = SMTPConnection(self.config)
        try:
            connection.connect()
        except SMTPConnectionError as e:
            logger.info(e)
        finally:
            return connection

    def _initialize_pool(self):
        for _ in range(self.pool_size):
            conn = self._create_connection()
            self._pool.put(conn)

    def acquire(self) -> SMTPConnection:
        return self._pool.get()

    def release(self, conn: SMTPConnection):
        try:
            conn.validate()
        except SMTPConnectionError:
            logger.info("reconnecte SMTP connection")
            try:
                conn.connect()
            except SMTPConnectionError as e:
                logger.info(e)
        self._pool.put(conn)

    def quit(self):
        while not self._pool.empty():
            conn = self._pool.get()
            conn.quit()
