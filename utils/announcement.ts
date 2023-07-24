class Announcement {
    announcement: string
    constructor(announcement: string) {
        this.announcement = announcement
    }

    setAnnouncement(announcement: string) {
        this.announcement = announcement
    }

    getAnnouncement() {
        return this.announcement
    }
}

let announcement = new Announcement('¡Bienvenido a EducaHub!')

export default announcement