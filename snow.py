import time

class StarryNight:
    def __init__(self):
        self.sky = ["가을"] * 100  # 하늘은 가을로 가득 차 있습니다
        self.worries = None        # 아무 걱정도 없습니다
        self.my_youth = True       # 아직 나의 청춘이 다하지 않았습니다
        self.current_season = "가을"
        
    def count_stars(self):
        # 가슴속에 하나 둘 새겨지는 별
        stars_in_heart = []
        reasons_to_stop = ["아침이 옴", "내일 밤이 남음", "청춘이 다하지 않음"]
        
        print(f"[{self.current_season}의 밤, 별을 헤아립니다...]")
        
        # 별 하나에 의미를 부여합니다
        star_meanings = [
            "추억", "사랑", "쓸쓸함", "동경", "시", "어머니, 어머니"
        ]
        
        for meaning in star_meanings:
            print(f"별 하나에 {meaning}과...")
            stars_in_heart.append(meaning)
            time.sleep(1)  # 시적 호흡

        return stars_in_heart

    def call_distant_names(self):
        # 어머니에게 보내는 편지
        print("\n어머님, 나는 별 하나에 아름다운 말 한마디씩 불러봅니다.")
        
        memories = {
            "학교": ["책상을 같이 했던 아이들"],
            "이국소녀": ["패", "경", "옥"],
            "소녀들": ["벌써 아기 어머니가 된 계집애들"],
            "이웃": ["가난한 이웃 사람들"],
            "자연": ["비둘기", "강아지", "토끼", "노새", "노루"],
            "시인": ["프랑시스 잠", "라이너 마리아 릴케"]
        }
        
        for category, names in memories.items():
            print(f"{', '.join(names)}... ", end="")
        print("\n이네들은 너무나 멀리 있습니다. 별이 아스라이 멀듯이.")

    def longing_for_mother(self):
        location_mother = "북간도"
        print(f"\n어머님, 그리고 당신은 멀리 {location_mother}에 계십니다.")

    def feel_shame_and_hope(self):
        # 이름 쓰고 덮어버리기
        my_name = "윤동주"
        print(f"\n나는 무엇인지 그리워 이 많은 별빛이 내린 언덕 위에")
        print(f"내 이름자 '{my_name}'를 써보고 흙으로 덮어 버리었습니다.")
        
        insect_crying = True
        if insect_crying:
            print("밤을 새워 우는 벌레는 부끄러운 이름을 슬퍼하는 까닭입니다.")
            
        # 겨울이 지나고 봄이 옴 (희망)
        self.current_season = "봄"
        print("\n--- 계절이 바뀝니다: 겨울 -> 봄 ---")
        
        if self.current_season == "봄":
            print("무덤 위에 파란 잔디가 피어나듯이")
            print("내 이름자 묻힌 언덕 위에도 자랑처럼 풀이 무성할 거외다.")

# --- 실행 (Poem Execution) ---
poet = StarryNight()
poet.count_stars()
poet.call_distant_names()
poet.longing_for_mother()
poet.feel_shame_and_hope()