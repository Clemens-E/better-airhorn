import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoundCommand } from './SoundCommand';

@Entity()
export class Vote extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => SoundCommand, command => command.votes)
    soundCommand: SoundCommand;

    @Column()
    user: string;

    @Column()
    isDownvote: boolean;

    get isUpvote(): boolean {
        return !this.isDownvote;
    }

    constructor(values?: { soundCommand: SoundCommand; user: string; isDownvote: boolean }) {
        super();
        if (values) {
            this.soundCommand = values.soundCommand;
            this.user = values.user;
            this.isDownvote = values.isDownvote;
        }
    }

}
