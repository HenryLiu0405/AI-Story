"""Template service — create projects from templates, export projects as templates, seed built-in templates."""

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.models import (
    Memory,
    MemoryType,
    Project,
    ProjectTemplate,
    StoryBibleCategory,
    StoryBibleEntry,
    TemplateGenre,
    generate_uuid,
)


# ------------------------------------------------------------------
# Built-in template data
# ------------------------------------------------------------------
BUILTIN_TEMPLATES = [
    {
        "name": "玄幻升级流",
        "description": "经典玄幻升级流模板，适合境界突破、宗门争斗、天材地宝等元素。包含修炼体系、主角成长线和势力格局设定，帮助快速搭建东方玄幻世界观。",
        "genre": TemplateGenre.XUANHUAN,
        "template_data": {
            "project_description": "这是一个玄幻升级流小说项目。主角从微末中崛起，通过不断突破境界、获取机缘、对抗强敌，最终踏上巅峰之路。",
            "memories": [
                {
                    "type": "world",
                    "title": "修炼境界体系",
                    "content": "当前设定包含以下境界：炼气期 → 筑基期 → 金丹期 → 元婴期 → 化神期 → 合体期 → 大乘期 → 渡劫期。每个境界分为初期、中期、后期、圆满四个阶段。突破需要功法、丹药、机缘三者配合。"
                },
                {
                    "type": "character",
                    "title": "主角",
                    "content": "姓名字号待定。出身平凡但天赋异禀，性格坚韧不拔，有强烈的变强执念。拥有特殊体质或血脉（待设定），在修炼道路上不断突破极限。核心价值观：守护所爱之人，追求大道巅峰。"
                },
                {
                    "type": "character",
                    "title": "导师/引路人",
                    "content": "身份待定。在主角微末时给予关键指点，可能是隐世高人、宗门长老或陨落强者残魂。自身有未竟的心愿或仇怨，将希望寄托于主角。"
                },
                {
                    "type": "character",
                    "title": "主要反派",
                    "content": "可以是同门竞争对手、敌对势力首领或觊觎主角机缘的强者。需设定其动机不单纯为恶，有自身立场和信念，与主角形成价值观冲突。"
                },
                {
                    "type": "plot",
                    "title": "主线剧情框架",
                    "content": "第一卷：微末崛起 — 主角在底层挣扎，获得关键机缘，初露锋芒。第二卷：宗门风云 — 进入宗门，参与内门大比，逐步建立势力。第三卷：乱世争锋 — 正魔大战或天地大劫爆发，主角在乱世中成长。后续卷：巅峰之路 — 探索世界真相，对抗最终敌人。"
                }
            ],
            "story_bible_entries": [
                {
                    "category": "world_rule",
                    "title": "修炼体系规则",
                    "content": "本世界以灵气为修炼基础。功法分为天地玄黄四阶，每阶又分上中下三品。突破大境界需要渡劫（金丹劫、元婴劫等），失败则修为倒退或陨落。丹药、阵法、炼器为三大辅助体系。"
                },
                {
                    "category": "faction",
                    "title": "势力格局",
                    "content": "正道联盟：以三大宗派为首，维护修炼界秩序。魔道：信奉力量至上，行事不拘手段。散修联盟：中立势力，为散修提供庇护。家族势力：以血脉传承为核心的修炼世家。远古遗族：隐藏在世界暗处的古老种族。"
                },
                {
                    "category": "timeline",
                    "title": "世界历史概览",
                    "content": "上古时代：仙魔大战，天地破碎。中古时代：修炼体系重建，宗门兴起。近古时代：正魔对峙，暗流涌动。当代：天地异变征兆出现，新一轮大争之世即将开启。"
                }
            ]
        }
    },
    {
        "name": "悬疑推理",
        "description": "适合悬疑推理小说创作，包含案件设定框架、侦探角色模板和线索管理体系。支持本格推理、社会派推理、犯罪心理等多种子类型。",
        "genre": TemplateGenre.MYSTERY,
        "template_data": {
            "project_description": "这是一个悬疑推理小说项目。通过精妙的案件设计和层层递进的线索揭示，带领读者体验抽丝剥茧的推理快感。",
            "memories": [
                {
                    "type": "plot",
                    "title": "核心案件设定",
                    "content": "核心案件类型待定（密室杀人/连环杀人/失踪案/盗窃案等）。案件应有至少三层真相：表象（误导线索）→ 中层（部分真相）→ 深层（完整动机和手法）。每个关键线索的发现应同时回答旧问题并提出新问题。"
                },
                {
                    "type": "character",
                    "title": "侦探/调查者",
                    "content": "身份待定（专业侦探/警察/记者/法医/律师等）。具备独特的推理方法或个人习惯。自身有未解决的心结或过往案件创伤，与当前案件可能产生共鸣。推理过程中应有误判和修正，展现人性化的一面。"
                },
                {
                    "type": "character",
                    "title": "嫌疑人群体",
                    "content": "至少设定3-5个关键嫌疑人，每人有明确的动机、机会和能力。每个嫌疑人都有隐藏的秘密（不一定是案件相关），形成干扰。某些嫌疑人之间可能存在隐秘的关系或利益纠葛。"
                },
                {
                    "type": "character",
                    "title": "受害者",
                    "content": "受害者背景应复杂多层，其死亡/受害方式应埋藏关键线索。生前的人际关系网是破案的核心切入点。受害者可能并非完全无辜，其过往行为可能是案件诱因之一。"
                },
                {
                    "type": "world",
                    "title": "故事背景设定",
                    "content": "建议设定具有封闭性或半封闭性的场景（小镇/家族/公司/学校/岛屿等），增强悬疑氛围和嫌疑人互动的密度。时代背景可以是当代都市、民国或架空现代。"
                }
            ],
            "story_bible_entries": [
                {
                    "category": "plot_thread",
                    "title": "线索链设计",
                    "content": "第一幕：发现案件，初步调查，锁定嫌疑人范围（抛出的线索应至少3条，其中1条为误导）。第二幕：深入调查，排除部分嫌疑人，发现更深层动机（关键逆转线索出现）。第三幕：真相揭晓，终极推理，揭示完整犯案过程和动机（所有线索收束）。"
                },
                {
                    "category": "world_rule",
                    "title": "推理规则约定",
                    "content": "向读者公平呈现所有关键线索（公平推理原则）。侦探使用的推理方法应在故事前期建立（如观察力、专业知识、逻辑推演等）。反转应有伏笔支撑，避免机械降神。社会派可侧重动机和人性探讨，本格派应侧重诡计和逻辑。"
                }
            ]
        }
    },
    {
        "name": "都市异能",
        "description": "都市异能小说模板，适合超能力、都市传说、隐秘组织等元素。包含异能体系设定、组织势力框架和都市世界观构建指南。",
        "genre": TemplateGenre.URBAN,
        "template_data": {
            "project_description": "这是一个都市异能小说项目。在现代都市的表象之下，隐藏着超自然力量的世界。主角在平凡生活中逐渐觉醒异能，卷入隐秘世界的纷争。",
            "memories": [
                {
                    "type": "world",
                    "title": "异能体系",
                    "content": "异能分为自然系（火/水/风/雷/土等）、强化系（身体强化/感官强化/速度等）、精神系（读心/念力/幻术等）、特异系（时间/空间/因果等稀有异能）。异能等级：觉醒期 → 掌控期 → 蜕变期 → 巅峰期 → 超越期。异能者通过修炼、战斗或吸收特殊物质提升等级。"
                },
                {
                    "type": "character",
                    "title": "主角",
                    "content": "普通都市人身份（学生/上班族/自由职业等），在一次意外事件中觉醒异能。初始异能可能看起来弱小但具有特殊潜力。性格应有成长弧光，从排斥异能到接受责任。日常身份和异能者身份的双重生活是核心冲突之一。"
                },
                {
                    "type": "character",
                    "title": "同伴/团队",
                    "content": "至少2-3名核心同伴，各具独特异能类型。团队成员之间应有互补性和化学反应。某些同伴可能有隐藏身份或秘密目的（但不一定是背叛）。"
                },
                {
                    "type": "character",
                    "title": "敌对组织",
                    "content": "至少1个主要敌对组织，有明确的组织目标和行动逻辑。组织成员不应脸谱化，需设定不同立场和动机的成员。组织与主角的关系可以从对抗到微妙合作。"
                }
            ],
            "story_bible_entries": [
                {
                    "category": "world_rule",
                    "title": "异能世界规则",
                    "content": "异能者必须在普通人面前隐藏能力（保密协议/管理局监管）。异能使用有代价或限制（精神力消耗/身体负担/时间限制等）。存在管理异能者的官方或半官方机构。异能者之间有不干预普通人社会的公约，但也存在违规者。"
                },
                {
                    "category": "faction",
                    "title": "势力格局",
                    "content": "异能管理局：官方机构，负责监管异能者、处理异能事件、维持隐秘。自由异能者联盟：不愿受官方约束的异能者互助组织。暗影议会：追求异能者统治普通人的激进组织。古老的异能家族：传承数百年的异能血脉世家。雇佣兵/中介组织：为各方提供异能相关服务的中间人。"
                },
                {
                    "category": "location",
                    "title": "主要场景",
                    "content": "故事主城市（建议使用现实城市但加入虚构地点）：异能者聚集的隐秘街区、管理局地下总部、古老家族祖宅、废弃工厂/仓库（战斗场景）、大学/公司（日常场景）。都市的繁华与隐秘世界的暗流形成对比。"
                }
            ]
        }
    },
    {
        "name": "恋爱群像",
        "description": "适合多角色恋爱群像剧创作，包含角色关系网络模板、情感线设计和冲突构建指南。支持校园恋爱、职场恋爱、古装恋爱等多种背景。",
        "genre": TemplateGenre.ROMANCE,
        "template_data": {
            "project_description": "这是一个恋爱群像小说项目。围绕多组人物的情感关系展开，每条感情线独立发展又相互交织，最终编织成完整的情感画卷。",
            "memories": [
                {
                    "type": "character",
                    "title": "男主",
                    "content": "性格设定待定（阳光/高冷/温柔/腹黑/天然等）。应有清晰的成长目标和情感障碍（过往创伤/家庭压力/事业冲突等）。与女主的初次相遇场景应具有独特性和记忆点。在群像中与其他男性角色的关系也应丰富（兄弟情/竞争/敌对等）。"
                },
                {
                    "type": "character",
                    "title": "女主",
                    "content": "性格设定待定（独立/可爱/御姐/天然呆/腹黑等）。应有独立于感情线之外的个人目标和成长。情感表达方式应有个人特色，避免套路化。与女性角色之间的友谊线同样重要。"
                },
                {
                    "type": "character",
                    "title": "配角CP群",
                    "content": "至少2-3对副CP，每对应有独特的情感模式（青梅竹马/欢喜冤家/虐恋/暗恋成真/破镜重圆等）。每对CP的进展节奏应错开，避免同质化。某些副CP的剧情应与主线产生交集或推动作用。"
                },
                {
                    "type": "plot",
                    "title": "情感冲突设计",
                    "content": "内部冲突：角色自身的性格缺陷、心理创伤、价值观冲突导致的感情障碍。外部冲突：家庭反对、阶级差异、事业与爱情的平衡、第三者的介入等。误会与和解：适度的误会增加戏剧张力，但和解应合理且有角色成长支撑。"
                }
            ],
            "story_bible_entries": [
                {
                    "category": "plot_thread",
                    "title": "感情线规划",
                    "content": "主线CP：相识 → 暧昧期 → 确认关系 → 第一次重大冲突 → 和解与成长 → 坚定相守。副CP1：初步建立 → 波折 → 发展。副CP2：从冲突到理解 → 暗生情愫。各条线的关键节点应交叉安排，保持读者对每条线的关注。"
                },
                {
                    "category": "theme",
                    "title": "核心主题",
                    "content": "爱情的多重面貌：不同角色展现爱情的不同阶段和形态。成长与自我认知：通过爱情关系认识自己、接纳自己。人际关系的边界：在亲密关系中保持自我与为对方改变的平衡。友情与爱情的互文：友谊在群像中与爱情同样重要。"
                }
            ]
        }
    },
    {
        "name": "科幻探索",
        "description": "科幻小说创作模板，适合太空探索、人工智能、未来社会、外星文明等题材。包含科技设定框架、世界观构建指南和未来历史时间线。",
        "genre": TemplateGenre.SCIFI,
        "template_data": {
            "project_description": "这是一个科幻小说项目。在未来的科技背景下，人类面临技术伦理、文明冲突和宇宙命运的深刻挑战。通过科幻设定探讨人性、社会和文明的本质。",
            "memories": [
                {
                    "type": "world",
                    "title": "科技设定",
                    "content": "核心科技概念待定（人工智能/太空航行/基因改造/虚拟现实/纳米技术/时间技术等）。科技发展应有内在逻辑和代价，不是万能的。科技对人类社会结构、伦理道德和日常生活的影响是故事的核心切入点。设定科技发展的阶段和关键突破时间点。"
                },
                {
                    "type": "character",
                    "title": "主角",
                    "content": "身份待定（科学家/探索者/工程师/AI/普通人等）。应具备与核心科技设定相关的专业能力或特殊身份。在科技伦理和人性选择之间面临关键抉择。对科技发展的态度可以有从乐观到警惕的转变弧光。"
                },
                {
                    "type": "character",
                    "title": "AI/非人角色",
                    "content": "如果设定包含AI，需明确其意识/智能的边界和本质。AI角色的行为逻辑应与人类有本质差异但又能被理解。AI与人类的关系可以是协作、对抗或演化共生。AI角色不应只是工具人，应有自身的困惑和追求。"
                },
                {
                    "type": "character",
                    "title": "对立势力/观点代表",
                    "content": "科技进步派 vs 科技审慎派。代表不同利益集团或意识形态的组织。具有合理动机和世界观的对手，不是纯粹的反派。某些势力可能与主角有共同目标但手段不同。"
                },
                {
                    "type": "plot",
                    "title": "主线冲突",
                    "content": "核心冲突建议从以下维度选取1-2个：人类vs技术（技术失控或伦理困境）、人类vs外星文明（首次接触或文明冲突）、人类vs环境（资源枯竭或生态灾难）、人类vs自身（社会制度或人性异化）。"
                }
            ],
            "story_bible_entries": [
                {
                    "category": "world_rule",
                    "title": "未来世界规则",
                    "content": "设定故事发生的具体年代（近未来50年 / 远未来200+年 / 星际时代）。政治格局：国家形态可能已变化（全球政府/企业统治/星际联邦等）。社会结构：科技进步导致的社会阶层变化。经济体系：可能的后稀缺经济或新型资源争夺。法律与伦理：针对新科技的特殊法律和伦理规范。"
                },
                {
                    "category": "timeline",
                    "title": "未来历史时间线",
                    "content": "建议设定：现在→20XX年（关键技术突破）→20XX年（社会变革期）→20XX年（故事发生时间）。标注影响社会的重大事件：科技突破、战争/灾难、社会运动、制度变革、首次接触等。时间线应为故事中的冲突和角色动机提供历史背景。"
                },
                {
                    "category": "faction",
                    "title": "势力与组织",
                    "content": "科研机构：推动科技进步的核心力量，可能有不同学派之争。政府/管理机构：维持秩序与监管科技应用。企业/资本力量：利用科技获取利益，可能与公共利益冲突。民间/地下组织：科技难民、黑客团体、理想主义者等。外星势力（如适用）：其社会结构、价值观和与人类的互动模式。"
                }
            ]
        }
    }
]


# ------------------------------------------------------------------
# Template Service
# ------------------------------------------------------------------
class TemplateService:
    """Manage project templates: create from template, export to template, seed built-ins."""

    def create_project_from_template(
        self,
        db: Session,
        template: ProjectTemplate,
        name_override: Optional[str] = None,
    ) -> Project:
        """Create a new project from a template and copy all template assets into it.

        Copies: memories → Memory rows, story_bible_entries → StoryBibleEntry rows.
        Returns the newly created Project.
        """
        template_data = template.template_data or {}

        # 1. Create project
        project_name = name_override or template.name
        project_description = template_data.get("project_description", "") or template.description

        project = Project(
            id=generate_uuid(),
            name=project_name,
            description=project_description,
        )
        db.add(project)
        db.flush()  # get project.id without committing yet

        # 2. Copy memories
        memories_data = template_data.get("memories", [])
        for mem in memories_data:
            memory = Memory(
                id=generate_uuid(),
                project_id=project.id,
                type=self._parse_memory_type(mem.get("type", "custom")),
                title=mem.get("title", ""),
                content=mem.get("content", ""),
            )
            db.add(memory)

        # 3. Copy story bible entries
        bible_entries = template_data.get("story_bible_entries", [])
        for entry in bible_entries:
            bible = StoryBibleEntry(
                id=generate_uuid(),
                project_id=project.id,
                category=self._parse_bible_category(entry.get("category", "note")),
                title=entry.get("title", ""),
                content=entry.get("content", ""),
                source_type="template",
                confidence=0.8,
            )
            db.add(bible)

        db.commit()
        db.refresh(project)
        return project

    def export_project_as_template(
        self,
        db: Session,
        project: Project,
        name: str,
        description: str,
        genre: TemplateGenre,
        is_public: bool = False,
    ) -> ProjectTemplate:
        """Collect all memories and story bible entries from a project and save as a template."""
        memories = db.query(Memory).filter(Memory.project_id == project.id).all()
        bible_entries = (
            db.query(StoryBibleEntry)
            .filter(StoryBibleEntry.project_id == project.id)
            .all()
        )

        template_data = {
            "project_description": project.description or "",
            "memories": [
                {
                    "type": m.type.value if hasattr(m.type, "value") else str(m.type),
                    "title": m.title,
                    "content": m.content,
                }
                for m in memories
            ],
            "story_bible_entries": [
                {
                    "category": (
                        e.category.value
                        if hasattr(e.category, "value")
                        else str(e.category)
                    ),
                    "title": e.title,
                    "content": e.content,
                }
                for e in bible_entries
            ],
        }

        template = ProjectTemplate(
            id=generate_uuid(),
            name=name,
            description=description,
            genre=genre,
            template_data=template_data,
            is_public=is_public,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        return template

    def seed_builtin_templates(self, db: Session) -> int:
        """Insert built-in templates if no templates exist yet.

        Returns the number of templates seeded.
        """
        existing_count = db.query(ProjectTemplate).count()
        if existing_count > 0:
            return 0

        count = 0
        for tmpl in BUILTIN_TEMPLATES:
            template = ProjectTemplate(
                id=generate_uuid(),
                name=tmpl["name"],
                description=tmpl["description"],
                genre=tmpl["genre"],
                template_data=tmpl["template_data"],
                is_public=True,
            )
            db.add(template)
            count += 1

        db.commit()
        return count

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _parse_memory_type(raw: str) -> MemoryType:
        mapping = {
            "character": MemoryType.CHARACTER,
            "world": MemoryType.WORLD,
            "plot": MemoryType.PLOT,
            "custom": MemoryType.CUSTOM,
        }
        return mapping.get(raw, MemoryType.CUSTOM)

    @staticmethod
    def _parse_bible_category(raw: str) -> StoryBibleCategory:
        mapping = {
            "character": StoryBibleCategory.CHARACTER,
            "world_rule": StoryBibleCategory.WORLD_RULE,
            "location": StoryBibleCategory.LOCATION,
            "faction": StoryBibleCategory.FACTION,
            "timeline": StoryBibleCategory.TIMELINE,
            "plot_thread": StoryBibleCategory.PLOT_THREAD,
            "foreshadowing": StoryBibleCategory.FORESHADOWING,
            "theme": StoryBibleCategory.THEME,
            "style_rule": StoryBibleCategory.STYLE_RULE,
            "note": StoryBibleCategory.NOTE,
        }
        return mapping.get(raw, StoryBibleCategory.NOTE)


template_service = TemplateService()
