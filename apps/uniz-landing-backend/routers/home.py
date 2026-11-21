from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models
import schemas
from content_defaults import merge_block, resolve_contact, resolve_hero
from dependencies import AdminRole

router = APIRouter(prefix="/api/home", tags=["Home"])


def present_home(home_data) -> dict:
    if home_data is None:
        announcements = []
        stats = []
        images = []
        hero = None
        contact = None
    else:
        announcements = home_data.announcements or []
        stats = home_data.stats or []
        images = home_data.images or []
        hero = home_data.hero
        contact = home_data.contact
    return {
        "announcements": announcements,
        "stats": stats,
        "images": images,
        "hero": resolve_hero(hero),
        "contact": resolve_contact(contact),
    }


@router.get("/", response_model=schemas.HomePageResponse, status_code=status.HTTP_200_OK)
async def get_home_data(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.HomePageData))
    home_data = result.scalars().first()
    return present_home(home_data)


@router.put("/", response_model=schemas.HomePageResponse, status_code=status.HTTP_200_OK)
async def sync_home_data(
    data: schemas.HomePageWrite,
    user: AdminRole,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(select(models.HomePageData))
        home_data = result.scalars().first()

        if not home_data:
            home_data = models.HomePageData()
            db.add(home_data)

        if data.announcements is not None:
            home_data.announcements = [item.model_dump() for item in data.announcements]
        if data.stats is not None:
            home_data.stats = [item.model_dump() for item in data.stats]
        if data.images is not None:
            home_data.images = data.images

        home_data.hero = merge_block(
            home_data.hero,
            data.hero.model_dump() if data.hero is not None else None,
            resolve_hero,
        )
        home_data.contact = merge_block(
            home_data.contact,
            data.contact.model_dump() if data.contact is not None else None,
            resolve_contact,
        )

        await db.commit()
        await db.refresh(home_data)
        return present_home(home_data)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during home sync: {str(e)}",
        )
