from abc import ABC, abstractmethod


class EmailContentProvider(ABC):
    """이메일 콘텐츠(제목, 본문) 생성을 위한 추상 базовый класс"""

    def __init__(self, parameters: list):
        self.parameters = parameters

    @abstractmethod
    def get_subject(self) -> str:
        """이메일 제목을 반환합니다."""
        pass

    @abstractmethod
    def get_content(self) -> str:
        """이메일의 핵심 콘텐츠를 HTML 형식으로 반환합니다."""
        pass

    @abstractmethod
    def get_disclaimer(self) -> str:
        """이메일 푸터에 들어갈 고지 사항 문구를 반환합니다."""
        pass

    def get_body(self) -> str:
        """공통 템플릿을 사용하여 전체 이메일 본문을 HTML 형식으로 반환합니다."""
        content = self.get_content()
        disclaimer = self.get_disclaimer()
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; width: 100%; background-color: #f1f5f9; font-family: 'Inter', Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; border-collapse: collapse; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
                            <tr>
                                <td align="center" style="padding: 25px 0; background: linear-gradient(to right, #3B82F6, #1E3A8A);">
                                    <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 700; margin: 0;">Neves</h1>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff" style="padding: 40px 30px;">
                                    {content}
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#f8fafc" style="padding: 30px; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0; color: #64748B; font-size: 12px; text-align: center;">
                                        {disclaimer}
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #64748B; font-size: 12px; text-align: center;">
                                        &copy; 2025 Neves. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """


class SignupAuthEmail(EmailContentProvider):
    """회원가입 인증 이메일 콘텐츠를 생성합니다."""

    def get_subject(self) -> str:
        return "[Neves] 🚀 Neves에 오신 것을 환영합니다!"

    def get_content(self) -> str:
        if not self.parameters or len(self.parameters) < 1:
            raise ValueError("회원가입 이메일에 필요한 인증 코드가 없습니다.")
        auth_code = self.parameters[0]
        return f"""
        <h2 style="color: #1E3A8A; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">👤 계정을 거의 다 만들었어요!</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">Neves의 멤버가 되신 것을 환영합니다! 아래 코드를 사용하여 계정 설정을 완료해주세요.</p>
        <div style="border: 2px dashed #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 36px; font-weight: 700; color: #1E3A8A; letter-spacing: 8px; margin: 0; font-family: 'Courier New', Courier, monospace;">{auth_code}</p>
        </div>
        <p style="font-size: 14px; color: #64748B; text-align: center;">이 코드는 10분 동안 유효합니다.</p>
        """

    def get_disclaimer(self) -> str:
        return "본인이 요청하지 않으셨다면 이 메일은 무시하셔도 괜찮습니다."


class TwoFactorAuthEmail(EmailContentProvider):
    """2단계 인증 이메일 콘텐츠를 생성합니다."""

    def get_subject(self) -> str:
        return "[Neves] 🔒 2단계 인증 코드를 확인하세요"

    def get_content(self) -> str:
        if not self.parameters or len(self.parameters) < 1:
            raise ValueError("2단계 인증 이메일에 필요한 인증 코드가 없습니다.")
        auth_code = self.parameters[0]
        return f"""
        <h2 style="color: #1E3A8A; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">🔒 2단계 인증 요청</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">계정을 안전하게 보호하기 위해, 아래 코드를 입력하여 로그인을 완료해주세요.</p>
        <div style="border: 2px dashed #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 36px; font-weight: 700; color: #1E3A8A; letter-spacing: 8px; margin: 0; font-family: 'Courier New', Courier, monospace;">{auth_code}</p>
        </div>
        <p style="font-size: 14px; color: #64748B; text-align: center;">이 코드는 5분 동안 유효합니다.</p>
        """

    def get_disclaimer(self) -> str:
        return "본인이 로그인을 시도하지 않았다면 즉시 비밀번호를 변경하세요."


class BlackboxUnconnectedEmail(EmailContentProvider):
    """블랙박스 연결 끊김 경고 이메일 콘텐츠를 생성합니다."""

    def get_subject(self) -> str:
        return "[Neves] ❗️ [경고] 블랙박스 연결이 끊어졌습니다"

    def get_content(self) -> str:
        if not self.parameters or len(self.parameters) < 2:
            raise ValueError(
                "블랙박스 연결 끊김 이메일에 필요한 파라미터(ID, 시간)가 없습니다."
            )
        blackbox_id = self.parameters[0]
        disconnected_at = self.parameters[1]
        return f"""
        <h2 style="color: #DC2626; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">❗️ 블랙박스 연결 끊김</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">블랙박스 장치의 연결이 끊어진 것이 감지되었습니다. 즉시 확인이 필요합니다.</p>
        <div style="background-color: #FEF2F2; border: 1px solid #FEE2E2; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #334155; font-size: 16px; margin: 0; text-align: center;"><strong>블랙박스 ID:</strong> {blackbox_id}</p>
            <p style="color: #334155; font-size: 16px; margin: 10px 0 0 0; text-align: center;"><strong>연결 끊김 시간:</strong> {disconnected_at}</p>
        </div>
        <p style="font-size: 14px; color: #64748B; text-align: center;">장치의 전원과 네트워크 연결을 확인해주세요.</p>
        """

    def get_disclaimer(self) -> str:
        return "이 알림이 잘못되었다고 생각되면 고객 지원팀에 문의하세요."


class DefaultEmail(EmailContentProvider):
    """기본 이메일 템플릿입니다."""

    def __init__(self, format_type: str, parameters: list):
        super().__init__(parameters)
        self.format_type = format_type

    def get_subject(self) -> str:
        return f"[Neves] 📢 시스템 알림: {self.format_type}"

    def get_content(self) -> str:
        return f"""
        <h2 style="color: #1E3A8A; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">📢 시스템 알림</h2>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;"><strong>알림 종류:</strong> {self.format_type}</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;"><strong>세부 정보:</strong> {str(self.parameters)}</p>
        </div>
        """

    def get_disclaimer(self) -> str:
        return "이 메일은 시스템에서 자동으로 발송되었습니다."


def get_email_content_provider(
    format_type: str, parameters: list
) -> EmailContentProvider:
    """format_type에 따라 적절한 EmailContentProvider 인스턴스를 반환하는 팩토리 함수"""
    provider_map = {
        "SIGNUP_AUTH": SignupAuthEmail,
        "2FA_AUTH": TwoFactorAuthEmail,
        "BLACKBOX_UNCONNECTED": BlackboxUnconnectedEmail,
    }
    provider_class = provider_map.get(format_type)

    if provider_class:
        return provider_class(parameters)
    else:
        return DefaultEmail(format_type, parameters)
