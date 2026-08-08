export default function ServiceTermsPage() {
  return (
    <div className="px-6 py-6 text-[14px] leading-relaxed text-[#333]">
      <h1 className="mb-6 text-[20px] font-bold text-[#111]">서비스 이용약관</h1>

      <Section title="제1조 (목적)">
        이 약관은 다올스테이션(이하 “회사”)이 제공하는 가다올 서비스(이하 “서비스”)의 이용과
        관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
        합니다.
      </Section>

      <Section title="제2조 (이용 자격)">
        본 서비스는 만 14세 이상인 자만 이용할 수 있습니다. 만 14세 미만 아동은 서비스에 가입하거나
        이용할 수 없습니다.
      </Section>

      <Section title="제3조 (용어의 정의)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>“서비스”란 회사가 제공하는 가다올 여행 계획 서비스 일체를 의미합니다.</li>
          <li>“이용자”란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원을 말합니다.</li>
          <li>
            “회원”이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로
            제공받으며 서비스를 이용할 수 있는 자를 말합니다.
          </li>
          <li>
            “콘텐츠”란 회원이 서비스를 이용하여 작성·등록한 여행 일정, 메모, 경비 등 일체의 정보를
            말합니다.
          </li>
        </ol>
      </Section>

      <Section title="제4조 (약관의 게시와 개정)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
          <li>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
          <li>
            약관을 개정할 경우, 회사는 개정 내용과 시행일을 명시하여 현행 약관과 함께 서비스 화면에
            그 시행일 7일 이전부터 공지합니다. 다만, 이용자에게 불리한 약관의 개정의 경우에는 30일
            이전부터 공지합니다.
          </li>
          <li>
            이용자는 개정약관에 동의하지 않을 경우 회원 탈퇴를 요청할 수 있습니다. 개정 약관의 효력
            발생일 이후에도 서비스를 계속 이용할 경우 약관의 변경에 동의한 것으로 간주합니다.
          </li>
        </ol>
      </Section>

      <Section title="제5조 (서비스의 제공)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            회사는 다음과 같은 서비스를 제공합니다.
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>여행 일정 계획 및 관리 서비스</li>
              <li>AI 기반 여행지 추천 서비스</li>
              <li>여행 경비 관리 서비스</li>
              <li>장소 검색 및 저장 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ul>
          </li>
          <li>
            서비스는 연중무휴 24시간 제공함을 원칙으로 합니다. 다만, 시스템 정기점검, 장애 등의
            사유로 일시 중단될 수 있습니다.
          </li>
          <li>
            회사는 서비스의 일부 또는 전부를 회사의 사정에 따라 변경할 수 있으며, 이 경우 사전에
            공지합니다.
          </li>
        </ol>
      </Section>

      <Section title="제6조 (유료 서비스)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>회사는 서비스 내에서 Pro, Plus 등 유료 구독 플랜을 제공합니다.</li>
          <li>유료 서비스의 이용요금 및 결제 방식은 유료서비스 이용약관에 따릅니다.</li>
          <li>이용자가 유료 서비스를 결제한 경우, 관련 법령에 따른 청약철회 규정이 적용됩니다.</li>
        </ol>
      </Section>

      <Section title="제7조 (회원의 의무)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            회원은 다음 행위를 하여서는 안 됩니다.
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>신청 또는 변경 시 허위 내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사 및 기타 제3자의 저작권 등 지식재산권 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>
                외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개
                또는 게시하는 행위
              </li>
              <li>기타 불법적이거나 부당한 행위</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title="제8조 (서비스 이용 제한)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고,
            일시 정지, 영구 이용 정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
          </li>
          <li>이용 제한 조치가 취해진 경우 이용자는 이의 신청을 할 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제9조 (책임의 한계)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            회사는 천재지변, 불가항력적 사유로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에
            관한 책임이 면제됩니다.
          </li>
          <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
          <li>
            회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.
          </li>
          <li>
            AI 기반 서비스의 결과물은 참고용으로만 제공되며, 회사는 AI 추천 여행 정보의 정확성에
            대한 보증을 하지 않습니다.
          </li>
        </ol>
      </Section>

      <Section title="제10조 (개인정보 보호)">
        회사는 이용자의 개인정보를 관련 법령과 개인정보처리방침에 따라 보호합니다.
      </Section>

      <Section title="제11조 (분쟁 해결)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            서비스 이용과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 양 당사자의 합의에 의해
            원만히 해결하는 것을 원칙으로 합니다.
          </li>
          <li>분쟁이 해결되지 아니한 경우 관련 법령에 따릅니다.</li>
        </ol>
      </Section>

      <div className="mt-8 text-[12px] text-[#999]">
        <p>시행일: 2025년 1월 1일</p>
        <p className="mt-1">회사: 다올스테이션</p>
        <p>대표: [대표자명]</p>
        <p>주소: [주소]</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-[15px] font-bold text-[#111]">{title}</h2>
      <div className="text-[#555]">{children}</div>
    </section>
  )
}
