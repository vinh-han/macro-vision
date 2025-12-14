import asyncio

from ingredients.classes import ClassGenerator
from utils.logger import setup_logger

from grouper.grouping import Grouper


async def main():
    logger = setup_logger(__name__, "ingredients/main.log")

    logger.info("STARTING INGREDIENT PROCESSING PIPELINE...")

    logger.info("[ RUN ]  Generating classes from raw ingredients...")
    generator = ClassGenerator()
    classes = generator.generate_classes(save=True)
    logger.info(f"[ OK ] Generated {len(classes)} classes")

    logger.info("[ RUN ]  Grouping raw ingredients to classes...")
    grouper = Grouper()
    groupings = await grouper.group_ingredients(save=True)
    logger.info(f"[ OK ] Grouped ingredients to {len(groupings)} classes")

    logger.info("[ OK ] Pipeline Completed")


if __name__ == "__main__":
    asyncio.run(main())
