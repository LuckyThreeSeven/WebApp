from smtp_connection_pool import SMTPConnectionPool, SMTPConnection
import logging

logger = logging.getLogger(__name__)


def send_gmail(smtp_cp: SMTPConnectionPool, to: str, subject: str, context: str):
    logger.info("send mail to %s with subject %s", to, subject)
    if smtp_cp is None:
        raise ValueError("SMTP Connection Pool is not initialized")

    trial = 3
    conn = smtp_cp.acquire()
    while trial > 0:
        if _send_to_connection(conn, to, subject, context):
            break
        else:
            trial -= 1
            try:
                conn.connect()
            except Exception as e:
                logger.info("Failed to reconnect SMTP connection: %s", e)
            if trial > 0:
                logger.info("Retrying to send email, attempts left: %d", trial)
            else:
                logger.info("All attempts to send email failed")
    smtp_cp.release(conn)
    if trial == 0:
        raise RuntimeError("Failed to send email after multiple attempts")


def _send_to_connection(conn: SMTPConnection, to: str, subject: str, context: str):
    try:
        conn.send(to, subject, context)
        return True
    except Exception as e:
        logger.info("Failed to send email via SMTP: %s", e)
        return False
