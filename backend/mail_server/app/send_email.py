from smtp_connection_pool import SMTPConnectionPool, SMTPConnection
import logging

logger = logging.getLogger(__name__)


def send_gmail(smtp_cp: SMTPConnectionPool, to: str, subject: str, context: str):
    logger.info("send mail to %s with subject %s", to, subject)
    if smtp_cp is None:
        raise ValueError("SMTP Connection Pool is not initialized")

    retry = 1
    conn = smtp_cp.acquire()
    while retry > 0:
        if _send_to_connection(conn, to, subject, context):
            break
        else:
            retry -= 1
            conn.connect()
            logger.info("Retrying to send email, attempts left: %d", retry)
    smtp_cp.release(conn)


def _send_to_connection(conn: SMTPConnection, to: str, subject: str, context: str):
    try:
        conn.send(to, subject, context)
        return True
    except Exception as e:
        logger.info("Failed to send email via SMTP: %s", e)
        return False
